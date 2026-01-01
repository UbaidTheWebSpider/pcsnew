const express = require('express');
const router = express.Router();
const {
    generatePharmacyCode,
    createPharmacy,
    getAllPharmacies,
    getPharmacyById,
    updatePharmacy,
    updateApprovalStatus,
    deletePharmacy,
    checkPharmacyNameUnique,
    getPharmacyStats
} = require('../controllers/pharmacyController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Generate pharmacy code
router.get('/generate-code', authorize('hospital_admin', 'super_admin'), generatePharmacyCode);

// Check pharmacy name uniqueness
router.get('/check-name', authorize('hospital_admin', 'super_admin'), checkPharmacyNameUnique);

// Get pharmacy statistics
router.get('/stats', authorize('hospital_admin', 'super_admin'), getPharmacyStats);

// CRUD operations
router.post('/', authorize('hospital_admin', 'super_admin'), createPharmacy);
router.get('/', getAllPharmacies);
router.get('/:id', getPharmacyById);
router.put('/:id', authorize('hospital_admin', 'super_admin'), updatePharmacy);
router.delete('/:id', authorize('hospital_admin', 'super_admin'), deletePharmacy);

// Approval workflow
router.patch('/:id/approval', authorize('hospital_admin', 'super_admin'), updateApprovalStatus);

// Seed sample medicines (one-time use for production setup)
const { seedMedicines, importMedicines } = require('../controllers/pharmacySeedController');
router.post('/seed-medicines', authorize('hospital_admin', 'super_admin', 'pharmacy_admin'), seedMedicines);
router.post('/import-medicines', authorize('hospital_admin', 'super_admin', 'pharmacy_admin', 'pharmacy'), importMedicines);

module.exports = router;
