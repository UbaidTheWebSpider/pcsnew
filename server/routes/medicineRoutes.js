const express = require('express');
const router = express.Router();
const {
    addMedicine,
    getMedicines,
    getMedicineById,
    updateMedicine,
    deleteMedicine,
    getLowStock,
    getExpiring,
    addBatch,
} = require('../controllers/medicineController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('pharmacy'), addMedicine)
    .get(protect, authorize('pharmacy'), getMedicines);

router.route('/alerts/low-stock')
    .get(protect, authorize('pharmacy'), getLowStock);

router.route('/alerts/expiring')
    .get(protect, authorize('pharmacy'), getExpiring);

router.route('/:id')
    .get(protect, authorize('pharmacy'), getMedicineById)
    .put(protect, authorize('pharmacy'), updateMedicine)
    .delete(protect, authorize('pharmacy'), deleteMedicine);

router.route('/:id/batches')
    .post(protect, authorize('pharmacy'), addBatch);

module.exports = router;
