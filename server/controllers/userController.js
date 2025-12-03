const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Helper to create user
const createUser = async (req, res, role) => {
    const { name, email, password, specialization, contact } = req.body;

    // Assuming the logged-in admin IS the hospital entity or represents it
    const hospitalId = req.user._id;

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
        res.json(doctors);
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

// @desc    Get all patients for a hospital
// @route   GET /api/users/patients
// @access  Private/Admin
const getPatients = async (req, res) => {
    try {
        const patients = await User.find({
            role: 'patient',
            hospitalId: req.user._id
        }).select('-password');

        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addDoctor,
    addPharmacy,
    addPatient,
    getDoctors,
    getPharmacies,
    getPatients,
    deleteUser,
};
