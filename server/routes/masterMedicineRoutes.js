const express = require('express');
const router = express.Router();
const masterMedicineController = require('../controllers/masterMedicineController');
const { protect } = require('../middleware/auth');

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
router.get('/filters', protect, masterMedicineController.getFilters);
router.get('/search', protect, masterMedicineController.searchMedicines);
router.get('/stats', protect, masterMedicineController.getMedicineStats);
router.get('/:id/batches', protect, masterMedicineController.getBatchesByMedicine);
router.get('/:id', protect, masterMedicineController.getMedicineById);
router.get('/', protect, masterMedicineController.getAllMedicines);

// Admin Routes (Create, Update, Delete)
router.post(
    '/',
    protect,
    authorize('admin', 'super_admin'),
    masterMedicineController.createMedicine
);

router.put(
    '/:id',
    protect,
    authorize('admin', 'super_admin'),
    masterMedicineController.updateMedicine
);

router.put(
    '/:id/discontinue',
    protect,
    authorize('admin', 'super_admin'),
    masterMedicineController.discontinueMedicine
);

module.exports = router;
