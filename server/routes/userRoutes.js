const express = require('express');
const router = express.Router();
const {
    addDoctor,
    addPharmacy,
    addPatient,
    getDoctors,
    getPharmacies,
    getPatients,
    deleteUser
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Doctor routes
router.post('/doctors', protect, adminOnly, addDoctor);
router.get('/doctors', protect, adminOnly, getDoctors);

// Pharmacy routes
router.post('/pharmacies', protect, adminOnly, addPharmacy);
router.get('/pharmacies', protect, adminOnly, getPharmacies);

// Patient routes
router.post('/patients', protect, adminOnly, addPatient);
router.get('/patients', protect, adminOnly, getPatients);

// Delete user
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;
