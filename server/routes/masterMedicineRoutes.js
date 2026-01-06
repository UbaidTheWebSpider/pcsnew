const express = require('express');
const router = express.Router();
const masterMedicineController = require('../controllers/masterMedicineController');
const { protect } = require('../middleware/authMiddleware');
const { attachPharmacyContext } = require('../middleware/pharmacyAuthMiddleware');

// Middleware to check if user has admin role
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }

        next();
    };
};

// Public/Pharmacy Routes (Read-Only for pharmacy users)
router.use(protect);
router.use(attachPharmacyContext);

router.get('/filters', masterMedicineController.getFilters);
router.get('/search', masterMedicineController.searchMedicines);
router.get('/stats', masterMedicineController.getMedicineStats);
router.get('/:id/batches', masterMedicineController.getBatchesByMedicine);
router.get('/:id', masterMedicineController.getMedicineById);
router.get('/', masterMedicineController.getAllMedicines);

// Admin Routes (Create, Update, Delete)
router.post(
    '/',
    authorize('admin', 'super_admin'),
    masterMedicineController.createMedicine
);

router.put(
    '/:id',
    authorize('admin', 'super_admin'),
    masterMedicineController.updateMedicine
);

router.put(
    '/:id/discontinue',
    authorize('admin', 'super_admin'),
    masterMedicineController.discontinueMedicine
);

module.exports = router;
