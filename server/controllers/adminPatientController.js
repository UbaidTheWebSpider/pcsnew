const Patient = require('../models/Patient');
const User = require('../models/User');

// @desc    Get all patients with pagination, search, and checks
// @route   GET /api/admin/patients
// @access  Private/Admin
const getAdminPatients = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            status,
            patientType,
            gender,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build Query
        const query = { isDeleted: false };

        // 0. Hospital Context / Data Isolation
        let hospitalId;
        if (req.user.role === 'hospital_admin') {
            hospitalId = req.user._id;
        } else if (req.user.role === 'hospital_staff') {
            hospitalId = req.user.hospitalId;
        }
        // Super Admins can see all, or we can filter if they provide a hospitalId in query (future proof)

        if (hospitalId) {
            query.hospitalId = hospitalId;
        }

        // 1. Search Query (Name, PatientID, Phone, CNIC)
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { patientId: { $regex: search, $options: 'i' } },
                { 'contact.phone': { $regex: search, $options: 'i' } },
                { cnic: { $regex: search, $options: 'i' } }
            ];
        }

        // 2. Filters
        if (status) query.status = status;
        if (patientType) query.patientType = patientType;
        if (gender) query.gender = gender;

        // 3. Sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // 4. Pagination
        const pageNumber = parseInt(page);
        const pageSize = parseInt(limit);
        const skip = (pageNumber - 1) * pageSize;

        // Execute Query
        const totalRecords = await Patient.countDocuments(query);
        const patients = await Patient.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(pageSize)
            .lean();

        // MERGE LOGIC (Crucial for Health IDs stored in User model)
        const userIds = patients.map(p => p.userId).filter(id => id);
        const users = await User.find({ _id: { $in: userIds } }).select('healthId healthCardQr healthCardIssueDate photoUrl cnic contact gender dateOfBirth').lean();

        const userMap = new Map();
        users.forEach(u => userMap.set(u._id.toString(), u));

        const mergedPatients = patients.map(patient => {
            const user = patient.userId ? userMap.get(patient.userId.toString()) : null;
            if (user) {
                return {
                    ...patient,
                    // Merge fields, preferring Patient but falling back or overriding based on importance
                    // CRITICAL: Prefer User's healthId if Patient's is missing
                    healthId: patient.healthId || user.healthId,
                    healthCardQr: patient.healthCardQr || user.healthCardQr,
                    healthCardIssueDate: patient.healthCardIssueDate || user.healthCardIssueDate,
                    // Other fallbacks
                    photoUrl: patient.photoUrl || user.photoUrl,
                    gender: patient.gender || user.gender,
                    dateOfBirth: patient.dateOfBirth || user.dateOfBirth,
                    contact: { ...patient.contact, ...user.contact }
                };
            }
            return patient;
        });

        res.json({
            patients: mergedPatients,
            totalRecords,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalRecords / pageSize),
            pageSize
        });

    } catch (error) {
        console.error('Error fetching admin patients:', error);
        res.status(500).json({ message: 'Failed to fetch patients', error: error.message });
    }
};

// @desc    Update patient status
// @route   PATCH /api/admin/patients/:id/status
// @access  Private/Admin
const updatePatientStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        patient.status = status;
        await patient.save();

        res.json({ message: `Patient status updated to ${status}`, patient });
    } catch (error) {
        console.error('Error updating patient status:', error);
        res.status(500).json({ message: 'Failed to update status', error: error.message });
    }
};

const updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const patient = await Patient.findById(id);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // 1. Update Patient record
        const updatedPatient = await Patient.findByIdAndUpdate(
            id,
            { ...updateData, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        // 2. Sync with User record if applicable
        if (updatedPatient.userId) {
            const userUpdate = {};
            if (updateData.name) userUpdate.name = updateData.name;
            if (updateData.email) userUpdate.email = updateData.email;
            if (updateData.contact) userUpdate.contact = updateData.contact;
            if (updateData.gender) userUpdate.gender = updateData.gender;
            if (updateData.dateOfBirth) userUpdate.dateOfBirth = updateData.dateOfBirth;
            if (updateData.cnic) userUpdate.cnic = updateData.cnic;

            if (Object.keys(userUpdate).length > 0) {
                await User.findByIdAndUpdate(updatedPatient.userId, userUpdate);
            }
        }

        res.json({
            message: 'Patient profile updated successfully',
            patient: updatedPatient
        });
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ message: 'Failed to update patient', error: error.message });
    }
};

// @desc    Soft delete patient
// @route   DELETE /api/admin/patients/:id
// @access  Private/Admin
const deletePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await Patient.findById(id);

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Soft delete
        patient.isDeleted = true;
        patient.status = 'Discharged'; // Logical status update
        await patient.save();

        // Optional: Log the deletion
        console.log(`Patient ${id} soft-deleted by ${req.user._id}`);

        res.json({ message: 'Patient removed successfully (soft-deleted)' });
    } catch (error) {
        console.error('Error deleting patient:', error);
        res.status(500).json({ message: 'Failed to delete patient', error: error.message });
    }
};

// @desc    Get single patient by ID (Admin detailed view)
// @route   GET /api/admin/patients/:id
// @access  Private/Admin
const getAdminPatientById = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await Patient.findById(id).lean();

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Sync/Merge with User data for Health ID and latest demographics
        if (patient.userId) {
            const user = await User.findById(patient.userId).select('healthId healthCardQr healthCardIssueDate photoUrl email contact gender dateOfBirth').lean();
            if (user) {
                return res.json({
                    ...patient,
                    email: user.email || patient.contact?.email || patient.email,
                    healthId: patient.healthId || user.healthId,
                    healthCardQr: patient.healthCardQr || user.healthCardQr,
                    healthCardIssueDate: patient.healthCardIssueDate || user.healthCardIssueDate,
                    photoUrl: patient.photoUrl || user.photoUrl,
                    gender: patient.gender || user.gender || '',
                    dateOfBirth: patient.dateOfBirth || user.dateOfBirth || '',
                    contact: { ...patient.contact, ...user.contact }
                });
            }
        }

        res.json(patient);
    } catch (error) {
        console.error('Error fetching patient profile:', error);
        res.status(500).json({ message: 'Failed to fetch patient details', error: error.message });
    }
};

// @desc    Get patient entitlements (Placeholder)
// @route   GET /api/admin/patients/:id/entitlements
const getPatientEntitlements = async (req, res) => {
    try {
        // In a real system, this would query an insurance or benefits microservice
        res.json({
            plan: 'Platinum Care Plan',
            status: 'active',
            coverage: 'Full Hospitalization',
            dependents: [],
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch entitlements' });
    }
};

// @desc    Update patient consent (Placeholder)
// @route   POST /api/admin/patients/:id/consent
const updatePatientConsent = async (req, res) => {
    try {
        const { action, scope } = req.body;
        // Logic for logging to an immutable ledger would go here
        res.status(200).json({
            message: `Consent ${action} for ${scope} updated successfully`,
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update consent' });
    }
};

// @desc    Generate Health ID (Admin workflow)
// @route   POST /api/admin/patients/:id/generate-health-id
const generateHealthId = async (req, res) => {
    try {
        const crypto = require('crypto');
        const { id } = req.params;

        const patient = await Patient.findById(id);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        // Generate unique Health ID
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = crypto.randomBytes(3).toString('hex').toUpperCase();
        const healthId = `HID-${timestamp}-${random}`;

        const qrData = JSON.stringify({
            hid: healthId,
            pid: patient.patientId,
            issued: new Date().toISOString()
        });

        // Update Patient
        patient.healthId = healthId;
        patient.healthCardQr = qrData;
        patient.healthCardIssueDate = new Date();
        await patient.save();

        // Sync with User
        if (patient.userId) {
            await User.findByIdAndUpdate(patient.userId, {
                healthId,
                healthCardQr: qrData,
                healthCardIssueDate: patient.healthCardIssueDate
            });
        }

        res.json({ success: true, healthId, qrCode: qrData });
    } catch (error) {
        console.error('ID Gen Error:', error);
        res.status(500).json({ message: 'Failed to generate ID' });
    }
};

module.exports = {
    getAdminPatients,
    updatePatientStatus,
    updatePatient,
    deletePatient,
    getAdminPatientById,
    getPatientEntitlements,
    updatePatientConsent,
    generateHealthId
};
