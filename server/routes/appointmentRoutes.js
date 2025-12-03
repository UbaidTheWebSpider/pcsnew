const express = require('express');
const router = express.Router();
const {
    getDoctorAppointments,
    updateAppointmentStatus,
    addConsultationNotes,
    bookAppointment,
    startConsultation
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/doctor', protect, getDoctorAppointments);
router.put('/:id/status', protect, updateAppointmentStatus);
router.put('/:id/notes', protect, addConsultationNotes);
router.post('/', protect, bookAppointment);
router.post('/start-consultation', protect, (req, res, next) => {
    console.log('🎯 START CONSULTATION ROUTE HIT!', req.body);
    startConsultation(req, res, next);
});

module.exports = router;
