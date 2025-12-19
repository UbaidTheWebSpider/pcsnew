const express = require('express');
const router = express.Router();
const {
    getAdminPatients,
    updatePatientStatus,
    updatePatient,
    deletePatient
} = require('../controllers/adminPatientController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Base Route: /api/admin/patients

router.get('/', protect, authorize('hospital_admin', 'hospital_staff', 'super_admin'), getAdminPatients);
router.put('/:id', protect, authorize('hospital_admin', 'hospital_staff', 'super_admin'), updatePatient);
router.patch('/:id/status', protect, authorize('hospital_admin', 'hospital_staff', 'super_admin'), updatePatientStatus);
router.delete('/:id', protect, authorize('hospital_admin', 'hospital_staff', 'super_admin'), deletePatient);

module.exports = router;
