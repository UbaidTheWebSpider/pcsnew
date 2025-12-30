const express = require('express');
const router = express.Router();
const {
    getAllBatches,
    addBatch,
    adjustStock,
    getExpiringMedicines,
    getLowStockItems,
    searchByBarcode
} = require('../controllers/pharmacyInventoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorizePharmacyRole, attachPharmacyContext } = require('../middleware/pharmacyAuthMiddleware');
const { auditLog } = require('../middleware/auditLogMiddleware');

// All routes require authentication
router.use(protect);
router.use(attachPharmacyContext);

// Get all batches
router.get('/batches',
    authorizePharmacyRole('pharmacy_admin', 'pharmacist', 'inventory_manager', 'cashier'),
    getAllBatches
);

// Add new batch
router.post('/batches',
    authorizePharmacyRole('pharmacy_admin', 'inventory_manager'),
    auditLog('create', 'batch'),
    addBatch
);

// Adjust stock
router.put('/batches/:id/adjust',
    authorizePharmacyRole('pharmacy_admin', 'inventory_manager'),
    auditLog('adjust_stock', 'batch'),
    adjustStock
);

// Get expiring medicines
router.get('/expiring',
    authorizePharmacyRole('pharmacy_admin', 'pharmacist', 'inventory_manager'),
    getExpiringMedicines
);

// Get low stock items
router.get('/low-stock',
    authorizePharmacyRole('pharmacy_admin', 'pharmacist', 'inventory_manager'),
    getLowStockItems
);

// Search by barcode
router.get('/barcode/:barcode',
    authorizePharmacyRole('pharmacy_admin', 'pharmacist', 'cashier'),
    searchByBarcode
);

module.exports = router;
