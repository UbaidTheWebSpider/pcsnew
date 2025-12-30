const express = require('express');
const router = express.Router();
const {
    createTransaction,
    getTransactions,
    processRefund,
    openShift,
    closeShift,
    getCurrentShift
} = require('../controllers/pharmacyPOSController');
const { protect } = require('../middleware/authMiddleware');
const { authorizePharmacyRole, attachPharmacyContext } = require('../middleware/pharmacyAuthMiddleware');
const { auditLog } = require('../middleware/auditLogMiddleware');

// All routes require authentication
router.use(protect);
router.use(attachPharmacyContext);

// Transaction routes
router.post('/transactions',
    authorizePharmacyRole('pharmacy_admin', 'cashier'),
    auditLog('create', 'transaction'),
    createTransaction
);

router.get('/transactions',
    authorizePharmacyRole('pharmacy_admin', 'cashier', 'auditor'),
    getTransactions
);

router.post('/transactions/:id/refund',
    authorizePharmacyRole('pharmacy_admin'),
    auditLog('refund', 'transaction'),
    processRefund
);

// Shift management routes
router.post('/shifts/open',
    authorizePharmacyRole('pharmacy_admin', 'cashier'),
    auditLog('create', 'shift'),
    openShift
);

router.post('/shifts/close',
    authorizePharmacyRole('pharmacy_admin', 'cashier'),
    auditLog('update', 'shift'),
    closeShift
);

router.get('/shifts/current',
    authorizePharmacyRole('pharmacy_admin', 'cashier'),
    getCurrentShift
);

module.exports = router;
