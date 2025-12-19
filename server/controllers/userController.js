const User = require('../models/User');
const Doctor = require('../models/Doctor');
const bcrypt = require('bcryptjs');

// Helper to create user
const createUser = async (req, res, role) => {
    const { name, email, password, specialization, contact, ...otherDetails } = req.body;

    // Determine hospitalId based on who is creating the user
    // If Admin: they ARE the hospital (use their _id)
    // If Staff: they belong to a hospital (use their hospitalId)
    const hospitalId = req.user.role === 'hospital_admin' ? req.user._id : req.user.hospitalId;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            hospitalId,
            specialization,
            contact,
        });

        if (user) {
            // If role is doctor, create Doctor profile
            if (role === 'doctor') {
                await Doctor.create({
                    userId: user._id,
                    personalDetails: {
                        gender: otherDetails.gender || 'Other',
                        dob: otherDetails.dob || new Date(),
                        photoUrl: otherDetails.photoUrl,
                        bio: otherDetails.bio,
                        languages: otherDetails.languages
                    },
                    professionalDetails: {
                        qualification: otherDetails.qualification || 'MBBS',
                        experience: otherDetails.experience || 0,
                        licenseNumber: otherDetails.licenseNumber || `LIC-${Date.now()}`,
                        department: otherDetails.department || specialization || 'General',
                        employmentType: otherDetails.employmentType || 'Full-time'
                    },
                    scheduleSettings: otherDetails.scheduleSettings,
                    consultationFees: otherDetails.consultationFees,
                    telemedicine: otherDetails.telemedicine
                });
            }

            // If role is patient, create Patient profile (Critical for Hospital Management)
            if (role === 'patient') {
                const Patient = require('../models/Patient');
                await Patient.create({
                    userId: user._id,
                    hospitalId: user.hospitalId, // usage of correct hospitalId derived above
                    name: user.name,
                    contact: user.contact,
                    gender: otherDetails.gender,
                    dateOfBirth: otherDetails.dateOfBirth,
                    cnic: (otherDetails.cnic === '' || otherDetails.cnic === null) ? undefined : otherDetails.cnic,
                    patientType: otherDetails.patientType || 'OPD',
                    status: otherDetails.status || 'Active',
                    createdBy: req.user._id
                });

                // Also update the User record with these basic details for easier querying
                user.gender = otherDetails.gender;
                user.dateOfBirth = otherDetails.dateOfBirth;
                await user.save();
            }

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                hospitalId: user.hospitalId,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        // Rollback user creation if doctor profile fails (basic compensation)
        if (role === 'doctor') {
            await User.findOneAndDelete({ email });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a new Doctor
// @route   POST /api/users/doctors
// @access  Private/Admin
const addDoctor = async (req, res) => {
    await createUser(req, res, 'doctor');
};

// @desc    Add a new Pharmacy
// @route   POST /api/users/pharmacies
// @access  Private/Admin
const addPharmacy = async (req, res) => {
    await createUser(req, res, 'pharmacy');
};

// @desc    Get all Doctors for this hospital
// @route   GET /api/users/doctors
// @access  Private/Admin
const getDoctors = async (req, res) => {
    try {
        const doctors = await User.find({
            hospitalId: req.user._id,
            role: 'doctor'
        }).select('-password');

        // Fetch full profiles for these doctors
        const doctorIds = doctors.map(d => d._id);
        const profiles = await Doctor.find({ userId: { $in: doctorIds } });

        // Merge data
        const detailedDoctors = doctors.map(doc => {
            const profile = profiles.find(p => p.userId.toString() === doc._id.toString());
            return {
                ...doc.toObject(),
                profile: profile || null
            };
        });

        res.json(detailedDoctors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all Pharmacies for this hospital
// @route   GET /api/users/pharmacies
// @access  Private/Admin
const getPharmacies = async (req, res) => {
    try {
        const pharmacies = await User.find({
            hospitalId: req.user._id,
            role: 'pharmacy'
        }).select('-password');
        res.json(pharmacies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            if (user.hospitalId.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized to delete this user' });
            }

            // If doctor, delete profile too
            if (user.role === 'doctor') {
                await Doctor.findOneAndDelete({ userId: user._id });
            }

            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add new patient (by hospital admin)
// @route   POST /api/users/patients
// @access  Private/Admin
const addPatient = async (req, res) => {
    const { name, email, password, contact } = req.body;

    try {
        // The createUser helper function expects req, res, and role as arguments.
        // It handles the creation and response itself.
        await createUser(req, res, 'patient');
    } catch (error) {
        // If createUser throws an error before sending a response, catch it here.
        // However, createUser already handles its own error responses.
        // This catch block might only be reached if createUser itself fails to execute.
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all patients for a hospital (from both User and Patient collections)
// @route   GET /api/users/patients
// @access  Private/Admin/Staff
const getPatients = async (req, res) => {
    try {
        console.log('--- getPatients Request ---');
        console.log('User:', req.user._id, 'Role:', req.user.role);

        const Patient = require('../models/Patient');

        // Determine hospitalId based on user role
        // Admin: use their own ID (they ARE the hospital)
        // Staff: use their hospitalId field (they belong to a hospital)
        const hospitalId = req.user.role === 'hospital_admin' ? req.user._id : req.user.hospitalId;

        console.log('Resolved hospitalId:', hospitalId);

        if (!hospitalId) {
            console.error('CRITICAL: No hospitalId found for User', req.user._id);
            return res.status(400).json({ message: 'Hospital ID not found for user. Please contact admin.' });
        }

        // 1. Fetch all users with role 'patient' for this hospital
        const userPatients = await User.find({
            role: 'patient',
            hospitalId: hospitalId
        }).select('-password').lean();

        // 2. Fetch all Patient records for this hospital
        const patientRecords = await Patient.find({
            hospitalId: hospitalId
        }).lean();

        // 3. Create a map of userId to Patient record for quick lookup
        const patientMap = new Map();
        patientRecords.forEach(patient => {
            if (patient.userId) {
                patientMap.set(patient.userId.toString(), patient);
            }
        });

        // 4. Merge User data with Patient data
        const mergedPatients = userPatients.map(user => {
            const patientData = patientMap.get(user._id.toString());

            if (patientData) {
                // Merge: User fields take precedence, but include Patient-specific fields
                return {
                    ...patientData,
                    ...user,
                    patientId: patientData.patientId || user._id.toString(),
                    // Ensure critical fields from Patient schema are included
                    healthId: patientData.healthId || user.healthId,
                    healthCardQr: patientData.healthCardQr || user.healthCardQr,
                    healthCardIssueDate: patientData.healthCardIssueDate || user.healthCardIssueDate,
                    photoUrl: patientData.photoUrl || user.photoUrl,
                    cnic: patientData.cnic || user.cnic,
                    bloodGroup: patientData.bloodGroup,
                    medicalHistory: patientData.medicalHistory,
                    // Merge contact info
                    contact: {
                        ...patientData.contact,
                        ...user.contact
                    }
                };
            }

            // User exists but no Patient record - return User data
            return {
                ...user,
                patientId: user._id.toString()
            };
        });

        // 5. Add Patient records that don't have a corresponding User (edge case)
        patientRecords.forEach(patient => {
            if (!patient.userId || !patientMap.has(patient.userId.toString())) {
                mergedPatients.push({
                    ...patient,
                    _id: patient._id,
                    name: patient.name,
                    email: patient.contact?.email || 'N/A',
                    role: 'patient'
                });
            }
        });

        console.log('Returning mergedPatients:', mergedPatients.length);
        console.log('=== END DEBUG ===\n');

        res.json(mergedPatients);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get patient by User ID (Admin view)
// @route   GET /api/users/patients/:id
// @access  Private/Admin
const getPatientById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const Patient = require('../models/Patient');

        // Try to find linked patient record
        let patient = await Patient.findOne({ userId: userId });

        // If not found, try by email (legacy link)
        if (!patient && user.email) {
            patient = await Patient.findOne({ 'contact.email': user.email });
            // If found by email, link it!
            if (patient) {
                patient.userId = userId;
                await patient.save();
            }
        }

        // If still not found, create one
        if (!patient) {
            patient = await Patient.create({
                userId: userId,
                name: user.name,
                contact: {
                    email: user.email,
                    phone: user.contact?.phone || '',
                    address: user.contact?.address || '',
                },
                hospitalId: user.hospitalId,
                gender: 'other', // Default, admin can update
                dateOfBirth: new Date(), // Default
            });
        }

        res.json(patient);
    } catch (error) {
        console.error("Error in getPatientById:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate Health ID for a patient
// @route   POST /api/users/patients/:id/generate-health-id
// @access  Private/Admin/Staff
const generateHealthId = async (req, res) => {
    try {
        const crypto = require('crypto');
        const patientId = req.params.id;

        console.log('Generating Health ID for patient:', patientId);

        // Find patient in User collection
        const patient = await User.findById(patientId);

        if (!patient) {
            console.log('Patient not found');
            return res.status(404).json({ message: 'Patient not found' });
        }

        if (patient.role !== 'patient') {
            return res.status(400).json({ message: 'User is not a patient' });
        }

        // Generate unique Health ID
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = crypto.randomBytes(3).toString('hex').toUpperCase();
        const healthId = `HID-${timestamp}-${random}`;

        // Generate QR data
        const qrData = JSON.stringify({
            hid: healthId,
            pid: patient._id.toString(),
            name: patient.name || patient.email.split('@')[0],
            issued: new Date().toISOString()
        });

        // Update patient in User collection
        patient.healthId = healthId;
        patient.healthCardQr = qrData;
        patient.healthCardIssueDate = new Date();
        await patient.save();

        // Also update in Patient collection if exists
        const Patient = require('../models/Patient');
        const patientRecord = await Patient.findOne({ userId: patient._id });

        if (patientRecord) {
            patientRecord.healthId = healthId;
            patientRecord.healthCardQr = qrData;
            patientRecord.healthCardIssueDate = new Date();
            await patientRecord.save();
        }

        console.log('Health ID generated:', healthId);

        res.status(200).json({
            success: true,
            healthId: healthId,
            message: 'Health ID generated successfully'
        });
    } catch (error) {
        console.error('Error generating Health ID:', error);
        res.status(500).json({ message: 'Failed to generate Health ID', error: error.message });
    }
};

module.exports = {
    addDoctor,
    addPharmacy,
    addPatient,
    getDoctors,
    getPharmacies,
    getPatients,
    getPatientById,
    deleteUser,
    generateHealthId
};
