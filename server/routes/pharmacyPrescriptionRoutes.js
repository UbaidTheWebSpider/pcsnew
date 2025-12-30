const express = require('express');
const router = express.Router();
const {
    getPendingPrescriptions,
    createFulfillment,
    updateFulfillment,
    validatePrescription,
    addSubstitution
} = require('../controllers/pharmacyPrescriptionController');
const { protect } = require('../middleware/authMiddleware');
const { authorizePharmacyRole, attachPharmacyContext } = require('../middleware/pharmacyAuthMiddleware');
const { auditLog } = require('../middleware/auditLogMiddleware');

// All routes require authentication
router.use(protect);
router.use(attachPharmacyContext);

// Get pending prescriptions
router.get('/pending',
    authorizePharmacyRole('pharmacy_admin', 'pharmacist'),
    getPendingPrescriptions
);

// Create fulfillment record
router.post('/:id/fulfill',
    authorizePharmacyRole('pharmacy_admin', 'pharmacist'),
    auditLog('create', 'fulfillment'),
    createFulfillment
);

// Update fulfillment (dispense medicines)
router.put('/:id/fulfill',
    authorizePharmacyRole('pharmacy_admin', 'pharmacist'),
    auditLog('dispense', 'fulfillment'),
    updateFulfillment
);

// Validate prescription
router.post('/:id/validate',
    authorizePharmacyRole('pharmacy_admin', 'pharmacist'),
    auditLog('validate', 'prescription'),
    validatePrescription
);

// Add medicine substitution
router.post('/:id/substitute',
    authorizePharmacyRole('pharmacy_admin', 'pharmacist'),
    auditLog('update', 'fulfillment'),
    addSubstitution
);

module.exports = router;
