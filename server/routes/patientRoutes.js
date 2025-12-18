const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    getDashboardStats,
    getAppointments,
    bookAppointment,
    cancelAppointment,
    getPrescriptions,
    getPrescriptionById,
    getDoctors,
    getDoctorById,
    joinConsultation,
} = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');

// Profile routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Dashboard
router.get('/dashboard', protect, getDashboardStats);

// Doctor discovery routes
router.get('/doctors', protect, getDoctors);
router.get('/doctors/:id', protect, getDoctorById);

// Appointment routes
router.get('/appointments', protect, getAppointments);
router.post('/appointments', protect, bookAppointment);
router.put('/appointments/:id/cancel', protect, cancelAppointment);
router.post('/appointments/join-consultation', protect, joinConsultation);

// Prescription routes
router.get('/prescriptions', protect, getPrescriptions);
router.get('/prescriptions/:id', protect, getPrescriptionById);

// --- PMI Extension Routes ---
const {
    checkForDuplicates,
    generateDigitalHealthId,
    updateConsent,
    getEntitlements
} = require('../controllers/patientControllerExtension');

router.post('/check-duplicates', protect, checkForDuplicates);
router.post('/:id/generate-health-id', protect, generateDigitalHealthId);
router.post('/:id/consent', protect, updateConsent);
router.get('/:id/entitlements', protect, getEntitlements);

module.exports = router;
