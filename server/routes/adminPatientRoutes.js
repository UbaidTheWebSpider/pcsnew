const express = require('express');
const router = express.Router();
const { getAdminPatients, updatePatientStatus } = require('../controllers/adminPatientController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Base Route: /api/admin/patients

router.get('/', protect, authorize('hospital_admin', 'hospital_staff', 'super_admin'), getAdminPatients);
router.patch('/:id/status', protect, authorize('hospital_admin', 'hospital_staff', 'super_admin'), updatePatientStatus);

module.exports = router;
