const express = require('express');
const router = express.Router();
const {
    checkInPatient,
    getDepartmentQueue,
    getPatientCheckIns,
    updateCheckInStatus,
    getQueueStats
} = require('../controllers/checkInController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Check-in routes
router.post('/', authorize('hospital_staff', 'hospital_admin'), checkInPatient);
router.get('/department/:dept', authorize('hospital_staff', 'hospital_admin', 'doctor'), getDepartmentQueue);
router.get('/patient/:id', getPatientCheckIns);
router.put('/status/:id', authorize('hospital_staff', 'hospital_admin', 'doctor'), updateCheckInStatus);
router.get('/stats', authorize('hospital_staff', 'hospital_admin'), getQueueStats);

module.exports = router;
