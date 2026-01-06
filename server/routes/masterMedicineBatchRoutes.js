const express = require('express');
const router = express.Router();
const masterMedicineBatchController = require('../controllers/masterMedicineBatchController');
const { protect } = require('../middleware/auth');
const pharmacyAuthMiddleware = require('../middleware/pharmacyAuthMiddleware');

// Apply pharmacy authentication middleware to all routes
router.use(protect);
router.use(pharmacyAuthMiddleware);

// Inventory Overview & Statistics
router.get('/stats', masterMedicineBatchController.getInventoryStats);
router.get('/expiring', masterMedicineBatchController.getExpiringBatches);
router.get('/low-stock', masterMedicineBatchController.getLowStockBatches);

// Barcode Search
router.get('/barcode/:barcode', masterMedicineBatchController.searchByBarcode);

// Batch Management
router.get('/', masterMedicineBatchController.getPharmacyInventory);
router.post('/batches', masterMedicineBatchController.addBatch);
router.put('/batches/:id', masterMedicineBatchController.updateBatch);
router.put('/batches/:id/adjust', masterMedicineBatchController.adjustStock);
router.put('/batches/:id/recall', masterMedicineBatchController.recallBatch);
router.delete('/batches/:id', masterMedicineBatchController.deleteBatch);

module.exports = router;
