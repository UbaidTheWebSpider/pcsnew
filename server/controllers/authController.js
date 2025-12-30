const User = require('../models/User');
const PharmacyUser = require('../models/PharmacyUser');
const Pharmacy = require('../models/Pharmacy');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, role, hospitalId, specialization, contact } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            hospitalId,
            specialization,
            contact,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {

            // Self-healing: Ensure pharmacy association for relevant roles
            if (['pharmacy', 'hospital_admin', 'pharmacist'].includes(user.role)) {
                try {
                    let pharmacyUser = await PharmacyUser.findOne({ userId: user._id });

                    if (!pharmacyUser) {
                        console.log(`[Auth] Creating missing pharmacy association for ${user.email}`);

                        // Find a default pharmacy
                        let pharmacy = await Pharmacy.findOne({ 'basicProfile.operationalStatus': 'Active' })
                            || await Pharmacy.findOne(); // Fallback to any pharmacy

                        if (pharmacy) {
                            await PharmacyUser.create({
                                userId: user._id,
                                pharmacyId: pharmacy._id,
                                pharmacyRole: user.role === 'hospital_admin' ? 'pharmacy_admin' : 'pharmacy_admin', // Default role
                                status: 'active',
                                permissions: ['all']
                            });
                            console.log(`[Auth] Successfully linked ${user.email} to ${pharmacy.basicProfile.pharmacyName}`);
                        } else {
                            console.warn('[Auth] No pharmacy found to link user');
                        }
                    } else if (pharmacyUser.status !== 'active') {
                        // Reactivate if needed
                        console.log(`[Auth] Reactivating pharmacy user for ${user.email}`);
                        pharmacyUser.status = 'active';
                        await pharmacyUser.save();
                    }
                } catch (err) {
                    console.error('[Auth] Error ensuring pharmacy association:', err);
                    // Don't block login, but log error
                }
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
};
