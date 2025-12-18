const express = require('express');
const router = express.Router();
const {
    admitPatient,
    getAdmissions,
    dischargePatient,
    updateAdmission
} = require('../controllers/admissionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('hospital_staff', 'hospital_admin'), getAdmissions);
router.post('/', protect, authorize('hospital_staff', 'hospital_admin'), admitPatient);
router.put('/:id', protect, authorize('hospital_staff', 'hospital_admin'), updateAdmission);
router.put('/:id/discharge', protect, authorize('hospital_staff', 'hospital_admin'), dischargePatient);

module.exports = router;
