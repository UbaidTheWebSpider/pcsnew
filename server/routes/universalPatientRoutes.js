const express = require('express');
const router = express.Router();
const { getPatients } = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get ALL patients (Universal Access for authorized roles)
// @route   GET /api/patients/all
// @access  Private (Staff, Doctor, Super Admin)
console.log('UPR: getPatients', typeof getPatients);
router.get('/all', protect, authorize('hospital_staff', 'doctor', 'super_admin'), getPatients);

module.exports = router;
