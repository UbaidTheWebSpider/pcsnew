const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    registerPatient,
    getAllPatients,
    getPatientById,
    updatePatient,
    deletePatient
} = require('../controllers/staffPatientController');

// All routes are protected and for hospital staff/admin
router.use(protect);
router.use(authorize('hospital_staff', 'hospital_admin', 'super_admin'));

router.post('/register', registerPatient);
router.get('/', getAllPatients);
router.get('/:id', getPatientById);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);

module.exports = router;
