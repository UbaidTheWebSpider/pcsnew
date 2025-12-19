const express = require('express');
const router = express.Router();
const {
    getAdminPatients,
    updatePatientStatus,
    updatePatient,
    deletePatient,
    getAdminPatientById,
    getPatientEntitlements,
    updatePatientConsent,
    generateHealthId
} = require('../controllers/adminPatientController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Base Route: /api/admin/patients

router.get('/', protect, authorize('hospital_admin', 'hospital_staff', 'super_admin'), getAdminPatients);
router.get('/:id', protect, authorize('hospital_admin', 'hospital_staff', 'super_admin'), getAdminPatientById);
router.get('/:id/entitlements', protect, authorize('hospital_admin', 'hospital_staff', 'super_admin'), getPatientEntitlements);
router.post('/:id/consent', protect, authorize('hospital_admin', 'hospital_staff', 'super_admin'), updatePatientConsent);
router.post('/:id/generate-health-id', protect, authorize('hospital_admin', 'hospital_staff', 'super_admin'), generateHealthId);
router.put('/:id', protect, authorize('hospital_admin', 'hospital_staff', 'super_admin'), updatePatient);
router.patch('/:id/status', protect, authorize('hospital_admin', 'hospital_staff', 'super_admin'), updatePatientStatus);
router.delete('/:id', protect, authorize('hospital_admin', 'hospital_staff', 'super_admin'), deletePatient);

module.exports = router;
