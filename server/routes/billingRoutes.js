const express = require('express');
const router = express.Router();
const {
    getInvoices,
    getInvoiceById,
    createInvoice,
    payInvoice,
} = require('../controllers/billingController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getInvoices);
router.post('/', protect, createInvoice); // Usually Admin/Doctor rights needed
router.get('/:id', protect, getInvoiceById);
router.post('/:id/pay', protect, payInvoice);

module.exports = router;
