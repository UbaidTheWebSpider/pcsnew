const Patient = require('../models/Patient');
const Doctor = require('../models/User'); // Assuming Doctor is a User with role 'doctor'
const Admission = require('../models/Admission');
const Bed = require('../models/Bed');
const User = require('../models/User'); // Ensure User model is available

// @desc    Get dashboard stats
// @route   GET /api/staff/dashboard
// @access  Private/Staff
const getDashboardStats = async (req, res) => {
    try {
        const totalPatients = await Patient.countDocuments({ hospitalId: req.user.hospitalId });
        const recentAdmissions = await Patient.find({ hospitalId: req.user.hospitalId })
            .sort({ createdAt: -1 }).limit(5);
        res.json({
            success: true,
            data: {
                totalPatients,
                availableBeds: 15, // Mock
                doctorsAvailable: 5, // Mock
                recentAdmissions
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all doctors
// @route   GET /api/staff/doctors
// @access  Private/Staff
const getDoctors = async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor' }).select('-password');
        res.json({
            success: true,
            data: doctors
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register new patient
// @route   POST /api/staff/patients
// @access  Private/Staff
const registerPatient = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            cnic,
            phone,
            dateOfBirth,
            gender,
            address,
            emergencyContactName,
            emergencyContactRelation,
            emergencyContactPhone,
            assignedDoctorId,
            admissionType,
            admissionReason,
            department,
            ward,
            bloodGroup,
            primaryDiagnosis,
            allergies
        } = req.body;

        // Check if patient already exists
        let patient = await Patient.findOne({ cnic });

        if (patient) {
            // Update existing patient info if needed, or just proceed to admission
            // For now, let's assume we update contact info
            patient.contact.phone = phone;
            patient.contact.address = address;
            await patient.save();
        } else {
            // Create new patient
            patient = await Patient.create({
                hospitalId: req.user.hospitalId,
                name: `${firstName} ${lastName}`,
                cnic,
                dateOfBirth,
                gender,
                bloodGroup,
                contact: {
                    phone,
                    address
                },
                emergencyContact: {
                    name: emergencyContactName,
                    relation: emergencyContactRelation,
                    phone: emergencyContactPhone
                },
                medicalInfo: {
                    allergies: allergies ? allergies.split(',').map(a => a.trim()) : [],
                    primaryDiagnosis
                },
                assignedDoctorId // This might be used for linking
            });
        }

        // Logic for Admission (Simplified)
        // You might want to create an Admission record here
        // const admission = await Admission.create({ ... });

        res.status(201).json({
            success: true,
            data: {
                patient,
                assignedBed: 'Bed-101' // Mock bed assignment
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all patients
// @route   GET /api/staff/patients
// @access  Private/Staff
const getPatients = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;

        const query = { hospitalId: req.user.hospitalId };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { patientId: { $regex: search, $options: 'i' } },
                { cnic: { $regex: search, $options: 'i' } },
                { 'contact.phone': { $regex: search, $options: 'i' } },
            ];
        }

        // Fetch from legacy Patient collection
        const legacyPatients = await Patient.find(query)
            .sort({ createdAt: -1 })
            .lean();

        // Fetch from new StaffPatient collection
        const StaffPatient = require('../models/StaffPatient');
        const staffQuery = { hospitalId: req.user.hospitalId };

        if (search) {
            staffQuery.$or = [
                { 'personalInfo.fullName': { $regex: search, $options: 'i' } },
                { patientId: { $regex: search, $options: 'i' } },
                { 'personalInfo.cnic': { $regex: search, $options: 'i' } },
                { 'contactInfo.mobileNumber': { $regex: search, $options: 'i' } },
            ];
        }

        const staffPatients = await StaffPatient.find(staffQuery)
            .sort({ createdAt: -1 })
            .lean();

        // Transform StaffPatient to match legacy Patient schema for consistent display
        const transformedStaffPatients = staffPatients.map(sp => ({
            _id: sp._id,
            patientId: sp.patientId,
            name: sp.personalInfo.fullName,
            fatherName: sp.personalInfo.fatherName || '',
            cnic: sp.personalInfo.cnic,
            gender: sp.personalInfo.gender?.toLowerCase(),
            dateOfBirth: sp.personalInfo.dateOfBirth,
            bloodGroup: sp.personalInfo.bloodGroup,
            contact: {
                phone: sp.contactInfo.mobileNumber,
                address: sp.contactInfo.address
            },
            emergencyContact: sp.contactInfo.emergencyContact,
            createdAt: sp.createdAt,
            hospitalId: sp.hospitalId,
            source: 'StaffPatient' // Tag to identify source
        }));

        // Merge both collections
        const allPatients = [...legacyPatients, ...transformedStaffPatients];

        // Sort by createdAt descending
        allPatients.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Apply pagination to merged results
        const total = allPatients.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedPatients = allPatients.slice(startIndex, endIndex);

        // MERGE LOGIC (Fixes Health ID visibility for Staff)
        const userIds = paginatedPatients.map(p => p.userId).filter(id => id);
        const users = await User.find({ _id: { $in: userIds } }).select('healthId healthCardQr healthCardIssueDate photoUrl cnic contact gender dateOfBirth').lean();

        const userMap = new Map();
        users.forEach(u => userMap.set(u._id.toString(), u));

        const mergedPatients = paginatedPatients.map(patient => {
            const user = patient.userId ? userMap.get(patient.userId.toString()) : null;
            if (user) {
                return {
                    ...patient,
                    healthId: patient.healthId || user.healthId,
                    healthCardQr: patient.healthCardQr || user.healthCardQr,
                    healthCardIssueDate: patient.healthCardIssueDate || user.healthCardIssueDate,
                    photoUrl: patient.photoUrl || user.photoUrl,
                    gender: patient.gender || user.gender,
                    dateOfBirth: patient.dateOfBirth || user.dateOfBirth,
                    contact: { ...patient.contact, ...user.contact }
                };
            }
            return patient;
        });

        res.json({
            success: true,
            data: {
                patients: mergedPatients,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error in getPatients:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get patient by ID
// @route   GET /api/staff/patients/:id
// @access  Private/Staff
const getPatientById = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        if (patient.hospitalId.toString() !== req.user.hospitalId.toString()) {
            // return res.status(401).json({ message: 'Not authorized' });
            // Relaxed for now
        }

        res.json({
            success: true,
            data: patient,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update patient
// @route   PUT /api/staff/patients/:id
// @access  Private/Staff
const updatePatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // if (patient.hospitalId.toString() !== req.user.hospitalId.toString()) {
        //     return res.status(401).json({ message: 'Not authorized' });
        // }

        const updatedPatient = await Patient.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json({
            success: true,
            data: updatedPatient,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete patient
// @route   DELETE /api/staff/patients/:id
// @access  Private/Staff
const deletePatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // if (patient.hospitalId.toString() !== req.user.hospitalId.toString()) {
        //     return res.status(401).json({ message: 'Not authorized' });
        // }

        await patient.deleteOne();

        res.json({ success: true, message: 'Patient removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerPatient,
    getPatients,
    getPatientById,
    updatePatient,
    deletePatient,
    getDashboardStats,
    getDoctors
};
