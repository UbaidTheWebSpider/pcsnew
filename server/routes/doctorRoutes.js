const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    generateSchedule,
    startTelemedicineSession,
    getPatients,
    getPatientById,
    addPatientNote,
    updatePatientNote,
    deletePatientNote,
    getAppointments,
    createAppointment,
    rescheduleAppointment,
    cancelAppointment,
    completeAppointment,
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Profile routes
router.get('/profile', protect, authorize('doctor'), getProfile);
router.put('/profile', protect, authorize('doctor'), updateProfile);

// Schedule routes
router.post('/schedule/generate', protect, authorize('doctor'), generateSchedule);

// Patient routes
router.get('/patients', protect, authorize('doctor'), getPatients);
router.get('/patients/:id', protect, authorize('doctor'), getPatientById);
router.post('/patients/:id/notes', protect, authorize('doctor'), addPatientNote);
router.put('/patients/:id/notes/:noteId', protect, authorize('doctor'), updatePatientNote);
router.delete('/patients/:id/notes/:noteId', protect, authorize('doctor'), deletePatientNote);

// Appointment routes
router.get('/appointments', protect, authorize('doctor'), getAppointments);
router.post('/appointments', protect, authorize('doctor'), createAppointment);
router.put('/appointments/:id/reschedule', protect, authorize('doctor'), rescheduleAppointment);
router.put('/appointments/:id/cancel', protect, authorize('doctor'), cancelAppointment);
router.put('/appointments/:id/complete', protect, authorize('doctor'), completeAppointment);
router.post('/appointments/:id/start-video', protect, authorize('doctor'), startTelemedicineSession);

module.exports = router;
