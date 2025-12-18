const express = require('express');
const router = express.Router();
const {
    addDoctor,
    addPharmacy,
    addPatient,
    getDoctors,
    getPharmacies,
    getPatients,
    getPatientById,
    deleteUser,
    generateHealthId
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Doctor routes
router.post('/doctors', protect, adminOnly, addDoctor);
router.get('/doctors', protect, adminOnly, getDoctors);

// Pharmacy routes
router.post('/pharmacies', protect, adminOnly, addPharmacy);
router.get('/pharmacies', protect, adminOnly, getPharmacies);

// Patient routes - Allow both admin and staff access
router.post('/patients', protect, adminOnly, addPatient);
router.get('/patients', protect, authorize('hospital_admin', 'hospital_staff'), getPatients);
router.get('/patients/:id', protect, authorize('hospital_admin', 'hospital_staff'), getPatientById);
router.post('/patients/:id/generate-health-id', protect, authorize('hospital_admin', 'hospital_staff'), generateHealthId);

// Delete user
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;
