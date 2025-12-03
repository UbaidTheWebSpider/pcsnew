const User = require('../models/User');
const Patient = require('../models/Patient');

// @desc    Get staff dashboard stats
// @route   GET /api/staff/dashboard
// @access  Private/Staff
const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get today's registrations
        const todayRegistrations = await Patient.countDocuments({
            createdAt: { $gte: today },
            hospitalId: req.user.hospitalId,
        });

        // Get total patients
        const totalPatients = await Patient.countDocuments({
            hospitalId: req.user.hospitalId,
        });

        res.json({
            success: true,
            data: {
                todayRegistrations,
                totalPatients,
                activeQueue: 0, // Will implement with queue system
                todayAppointments: 0, // Will implement with appointments
            },
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
        const { cnic, name, dateOfBirth, gender, contact, emergencyContact, medicalInfo } = req.body;

        // Check for duplicate CNIC
        if (cnic) {
            const existingPatient = await Patient.findOne({ cnic });
            if (existingPatient) {
                return res.status(400).json({ message: 'Patient with this CNIC already exists' });
            }
        }

        // Calculate age from date of birth
        const age = dateOfBirth ? Math.floor((new Date() - new Date(dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : null;

        const patient = await Patient.create({
            cnic,
            name,
            dateOfBirth,
            age,
            gender,
            contact,
            emergencyContact,
            medicalInfo,
            registeredBy: req.user._id,
            hospitalId: req.user.hospitalId,
        });

        res.status(201).json({
            success: true,
            data: patient,
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

        const total = await Patient.countDocuments(query);
        const patients = await Patient.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        res.json({
            success: true,
            data: {
                patients,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
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
            return res.status(401).json({ message: 'Not authorized' });
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

        if (patient.hospitalId.toString() !== req.user.hospitalId.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const { name, contact, emergencyContact, medicalInfo } = req.body;

        if (name) patient.name = name;
        if (contact) patient.contact = { ...patient.contact, ...contact };
        if (emergencyContact) patient.emergencyContact = { ...patient.emergencyContact, ...emergencyContact };
        if (medicalInfo) patient.medicalInfo = { ...patient.medicalInfo, ...medicalInfo };

        await patient.save();

        res.json({
            success: true,
            data: patient,
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
        const { department } = req.query;

        const query = {
            role: 'doctor',
            hospitalId: req.user.hospitalId,
        };

        if (department) {
            query.specialization = department;
        }

        const doctors = await User.find(query).select('-password');

        res.json({
            success: true,
            data: {
                doctors,
                total: doctors.length,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDashboardStats,
    registerPatient,
    getPatients,
    getPatientById,
    updatePatient,
    getDoctors,
};
