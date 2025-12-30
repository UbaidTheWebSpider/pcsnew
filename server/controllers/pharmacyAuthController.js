const PharmacyUser = require('../models/PharmacyUser');
const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');
const PharmacyAuditLog = require('../models/PharmacyAuditLog');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId, pharmacyRole) => {
    return jwt.sign(
        { id: userId, pharmacyRole },
        process.env.JWT_SECRET,
        { expiresIn: '15m' } // 15 minutes
    );
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '7d' } // 7 days
    );
};

// @desc    Register pharmacy user
// @route   POST /api/pharmacy/auth/register
// @access  Public
exports.registerPharmacyUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            pharmacyId,
            pharmacyRole,
            phone
        } = req.body;

        // Validate required fields
        if (!name || !email || !password || !pharmacyId || !pharmacyRole) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if pharmacy exists
        const pharmacy = await Pharmacy.findById(pharmacyId);
        if (!pharmacy) {
            return res.status(404).json({
                success: false,
                message: 'Pharmacy not found'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create user account
        const user = await User.create({
            name,
            email,
            password,
            role: 'pharmacy',
            contact: { phone }
        });

        // Create pharmacy user link
        const pharmacyUser = await PharmacyUser.create({
            userId: user._id,
            pharmacyId,
            pharmacyRole,
            status: 'pending' // Requires admin approval
        });

        // Create audit log
        await PharmacyAuditLog.createLog({
            pharmacyId,
            userId: user._id,
            userName: user.name,
            action: 'create',
            entity: 'user',
            entityId: pharmacyUser._id,
            description: `Pharmacy user registration - ${pharmacyRole}`,
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful. Awaiting admin approval.',
            data: {
                userId: user._id,
                pharmacyUserId: pharmacyUser._id,
                status: pharmacyUser.status
            }
        });
    } catch (error) {
        console.error('Register pharmacy user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: error.message
        });
    }
};

// @desc    Login pharmacy user
// @route   POST /api/pharmacy/auth/login
// @access  Public
exports.loginPharmacyUser = async (req, res) => {
    try {
        const { email, password, deviceId } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Find pharmacy user link
        const pharmacyUser = await PharmacyUser.findOne({
            userId: user._id,
            isDeleted: false
        }).populate('pharmacyId');

        if (!pharmacyUser) {
            return res.status(403).json({
                success: false,
                message: 'No pharmacy association found'
            });
        }

        // Check if approved
        if (pharmacyUser.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: `Account status: ${pharmacyUser.status}. Please contact admin.`
            });
        }

        // Update last login
        await pharmacyUser.updateLastLogin(deviceId);

        // Generate tokens
        const accessToken = generateToken(user._id, pharmacyUser.pharmacyRole);
        const refreshToken = generateRefreshToken(user._id);

        // Create audit log
        await PharmacyAuditLog.createLog({
            pharmacyId: pharmacyUser.pharmacyId._id,
            userId: user._id,
            userName: user.name,
            action: 'login',
            entity: 'user',
            entityId: user._id,
            description: 'User logged in',
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                deviceInfo: deviceId
            }
        });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    pharmacyRole: pharmacyUser.pharmacyRole
                },
                pharmacy: {
                    id: pharmacyUser.pharmacyId._id,
                    name: pharmacyUser.pharmacyId.basicProfile.pharmacyName
                },
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
};

// @desc    Refresh access token
// @route   POST /api/pharmacy/auth/refresh
// @access  Public
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token required'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
        );

        // Find pharmacy user
        const pharmacyUser = await PharmacyUser.findOne({
            userId: decoded.id,
            status: 'active'
        });

        if (!pharmacyUser) {
            return res.status(403).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Generate new access token
        const accessToken = generateToken(decoded.id, pharmacyUser.pharmacyRole);

        res.json({
            success: true,
            data: { accessToken }
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token'
        });
    }
};

// @desc    Logout pharmacy user
// @route   POST /api/pharmacy/auth/logout
// @access  Private
exports.logoutPharmacyUser = async (req, res) => {
    try {
        const pharmacyUser = await PharmacyUser.findOne({
            userId: req.user._id
        });

        if (pharmacyUser) {
            // Create audit log
            await PharmacyAuditLog.createLog({
                pharmacyId: pharmacyUser.pharmacyId,
                userId: req.user._id,
                userName: req.user.name,
                action: 'logout',
                entity: 'user',
                entityId: req.user._id,
                description: 'User logged out',
                metadata: {
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent')
                }
            });
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during logout'
        });
    }
};

// @desc    Approve pharmacy user
// @route   POST /api/pharmacy/auth/approve/:userId
// @access  Private (Admin only)
exports.approvePharmacyUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body; // 'active' or 'rejected'

        const pharmacyUser = await PharmacyUser.findOne({
            userId,
            status: 'pending'
        });

        if (!pharmacyUser) {
            return res.status(404).json({
                success: false,
                message: 'Pending pharmacy user not found'
            });
        }

        if (status === 'active') {
            await pharmacyUser.approve(req.user._id);
        } else {
            pharmacyUser.status = 'inactive';
            await pharmacyUser.save();
        }

        // Create audit log
        await PharmacyAuditLog.createLog({
            pharmacyId: pharmacyUser.pharmacyId,
            userId: req.user._id,
            userName: req.user.name,
            action: 'approve',
            entity: 'user',
            entityId: pharmacyUser._id,
            description: `User ${status === 'active' ? 'approved' : 'rejected'}`,
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        res.json({
            success: true,
            message: `User ${status === 'active' ? 'approved' : 'rejected'} successfully`,
            data: pharmacyUser
        });
    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during approval',
            error: error.message
        });
    }
};

// @desc    Get current pharmacy user profile
// @route   GET /api/pharmacy/auth/me
// @access  Private
exports.getPharmacyProfile = async (req, res) => {
    try {
        const pharmacyUser = await PharmacyUser.findOne({
            userId: req.user._id,
            isDeleted: false
        })
            .populate('userId', 'name email contact')
            .populate('pharmacyId', 'basicProfile.pharmacyName basicProfile.pharmacyType');

        if (!pharmacyUser) {
            return res.status(404).json({
                success: false,
                message: 'Pharmacy user profile not found'
            });
        }

        res.json({
            success: true,
            data: pharmacyUser
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching profile'
        });
    }
};
