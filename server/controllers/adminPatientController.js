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
        const query = {};

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

module.exports = {
    getAdminPatients,
    updatePatientStatus
};
