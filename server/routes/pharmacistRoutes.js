const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    createPharmacist,
    getPharmacists,
    getPharmacistById,
    updatePharmacist,
    deletePharmacist
} = require('../controllers/pharmacistController');

// All routes are protected
router.use(protect);

// Routes
router.route('/')
    .post(authorize('hospital_admin', 'super_admin'), createPharmacist)
    .get(authorize('hospital_admin', 'super_admin', 'pharmacy_admin'), getPharmacists);

router.route('/:id')
    .get(authorize('hospital_admin', 'super_admin', 'pharmacy_admin', 'pharmacist'), getPharmacistById)
    .put(authorize('hospital_admin', 'super_admin', 'pharmacy_admin'), updatePharmacist)
    .delete(authorize('hospital_admin', 'super_admin'), deletePharmacist);

module.exports = router;
