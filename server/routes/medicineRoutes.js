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
const { protect } = require('../middleware/authMiddleware');
const { authorizePharmacyRole, attachPharmacyContext } = require('../middleware/pharmacyAuthMiddleware');

router.use(protect);
router.use(attachPharmacyContext);

router.route('/')
    .post(authorizePharmacyRole('pharmacy', 'pharmacy_admin', 'inventory_manager'), addMedicine)
    .get(authorizePharmacyRole('pharmacy', 'pharmacy_admin', 'pharmacist', 'inventory_manager', 'auditor'), getMedicines);

router.route('/alerts/low-stock')
    .get(authorizePharmacyRole('pharmacy', 'pharmacy_admin', 'inventory_manager', 'pharmacist'), getLowStock);

router.route('/alerts/expiring')
    .get(authorizePharmacyRole('pharmacy', 'pharmacy_admin', 'inventory_manager', 'pharmacist'), getExpiring);

router.route('/:id')
    .get(authorizePharmacyRole('pharmacy', 'pharmacy_admin', 'pharmacist', 'inventory_manager', 'auditor'), getMedicineById)
    .put(authorizePharmacyRole('pharmacy', 'pharmacy_admin', 'inventory_manager'), updateMedicine)
    .delete(authorizePharmacyRole('pharmacy', 'pharmacy_admin'), deleteMedicine);

router.route('/:id/batches')
    .post(authorizePharmacyRole('pharmacy', 'pharmacy_admin', 'inventory_manager'), addBatch);

module.exports = router;
