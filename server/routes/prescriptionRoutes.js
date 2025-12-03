const express = require('express');
const router = express.Router();
const {
    createPrescription,
    getPrescriptionQueue,
    getPrescriptionById,
    processPrescription,
    updatePrescriptionStatus,
} = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createPrescription);

router.route('/queue')
    .get(protect, getPrescriptionQueue);

router.route('/:id')
    .get(protect, getPrescriptionById);

router.route('/:id/process')
    .put(protect, processPrescription);

router.route('/:id/status')
    .put(protect, updatePrescriptionStatus);

module.exports = router;
