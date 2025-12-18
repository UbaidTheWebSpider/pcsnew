const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    registerPatient,
    getPatients,
    getPatientById,
    updatePatient,
    deletePatient,
    getDoctors,
} = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');

// Dashboard
router.get('/dashboard', protect, getDashboardStats);

// Patient management
router.post('/patients', protect, registerPatient);
router.get('/patients', protect, getPatients);
router.get('/patients/:id', protect, getPatientById);
router.put('/patients/:id', protect, updatePatient);
router.delete('/patients/:id', protect, deletePatient);

// Doctors list
router.get('/doctors', protect, getDoctors);

module.exports = router;
