const express = require('express');
const router = express.Router();
const {
    getDashboardKPIs,
    getSalesAnalytics,
    getAlerts,
    getPrescriptionQueue
} = require('../controllers/pharmacyDashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorizePharmacyRole, attachPharmacyContext } = require('../middleware/pharmacyAuthMiddleware');

// All routes require authentication
router.use(protect);
router.use(attachPharmacyContext);

// Dashboard KPIs
router.get('/kpis',
    authorizePharmacyRole('pharmacy_admin', 'pharmacist', 'cashier', 'inventory_manager', 'auditor'),
    getDashboardKPIs
);

// Sales analytics
router.get('/analytics',
    authorizePharmacyRole('pharmacy_admin', 'auditor'),
    getSalesAnalytics
);

// Operational alerts
router.get('/alerts',
    authorizePharmacyRole('pharmacy_admin', 'pharmacist', 'inventory_manager'),
    getAlerts
);

// Prescription queue
router.get('/queue',
    authorizePharmacyRole('pharmacy_admin', 'pharmacist'),
    getPrescriptionQueue
);

module.exports = router;
