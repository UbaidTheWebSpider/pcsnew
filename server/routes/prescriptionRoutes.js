const express = require('express');
const router = express.Router();
const {
    createPrescription,
    getPrescriptionQueue,
    getPrescriptionById,
    processPrescription,
    updatePrescriptionStatus,
    getDoctorPrescriptions,
    updatePrescription,
    deletePrescription,
} = require('../controllers/prescriptionController');
const { getAvailableMedicines } = require('../controllers/medicineController');
const { protect } = require('../middleware/authMiddleware');

router.get('/meta/available-medicines', protect, getAvailableMedicines);

router.route('/')
    .post(protect, createPrescription);

router.route('/doctor')
    .get(protect, getDoctorPrescriptions);

router.route('/queue')
    .get(protect, getPrescriptionQueue);

router.route('/:id')
    .get(protect, getPrescriptionById)
    .put(protect, updatePrescription)
    .delete(protect, deletePrescription);

router.route('/:id/process')
    .put(protect, processPrescription);

router.route('/:id/status')
    .put(protect, updatePrescriptionStatus);

module.exports = router;
