const express = require('express');
const router = express.Router();
const {
    registerPharmacyUser,
    loginPharmacyUser,
    refreshToken,
    logoutPharmacyUser,
    approvePharmacyUser,
    getPharmacyProfile
} = require('../controllers/pharmacyAuthController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerPharmacyUser);
router.post('/login', loginPharmacyUser);
router.post('/refresh', refreshToken);

// Protected routes
router.use(protect); // All routes below require authentication

router.post('/logout', logoutPharmacyUser);
router.get('/me', getPharmacyProfile);

// Admin only routes
router.post('/approve/:userId', authorize('hospital_admin', 'super_admin'), approvePharmacyUser);

module.exports = router;
