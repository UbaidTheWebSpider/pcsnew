const PharmacyUser = require('../models/PharmacyUser');

// Pharmacy role-based authorization middleware
exports.authorizePharmacyRole = (...roles) => {
    return async (req, res, next) => {
        try {
            // Find pharmacy user
            const pharmacyUser = await PharmacyUser.findOne({
                userId: req.user._id,
                status: 'active',
                isDeleted: false
            });

            if (!pharmacyUser) {
                return res.status(403).json({
                    success: false,
                    message: 'No active pharmacy association found'
                });
            }

            // Check if user's role is in allowed roles
            if (!roles.includes(pharmacyUser.pharmacyRole)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required role: ${roles.join(' or ')}`
                });
            }

            // Attach pharmacy info to request
            req.pharmacyUser = pharmacyUser;
            req.pharmacyRole = pharmacyUser.pharmacyRole;
            req.pharmacyId = pharmacyUser.pharmacyId;

            next();
        } catch (error) {
            console.error('Authorization error:', error);
            res.status(500).json({
                success: false,
                message: 'Authorization error',
                error: error.message
            });
        }
    };
};

// Check if user has specific permission
exports.checkPermission = (permission) => {
    return async (req, res, next) => {
        try {
            const pharmacyUser = await PharmacyUser.findOne({
                userId: req.user._id,
                status: 'active'
            });

            if (!pharmacyUser) {
                return res.status(403).json({
                    success: false,
                    message: 'No pharmacy association found'
                });
            }

            // Define role-based permissions
            const rolePermissions = {
                pharmacy_admin: ['all'],
                pharmacist: [
                    'view_inventory',
                    'manage_inventory',
                    'view_prescriptions',
                    'fulfill_prescriptions',
                    'view_transactions'
                ],
                cashier: [
                    'view_inventory',
                    'create_transaction',
                    'process_payment',
                    'manage_shift'
                ],
                inventory_manager: [
                    'view_inventory',
                    'manage_inventory',
                    'add_batch',
                    'adjust_stock',
                    'view_suppliers'
                ],
                auditor: [
                    'view_inventory',
                    'view_prescriptions',
                    'view_transactions',
                    'view_audit_logs',
                    'view_reports'
                ]
            };

            const userPermissions = rolePermissions[pharmacyUser.pharmacyRole] || [];

            // Admin has all permissions
            if (userPermissions.includes('all')) {
                req.pharmacyUser = pharmacyUser;
                req.pharmacyRole = pharmacyUser.pharmacyRole;
                req.pharmacyId = pharmacyUser.pharmacyId;
                return next();
            }

            // Check if user has the required permission
            if (!userPermissions.includes(permission)) {
                return res.status(403).json({
                    success: false,
                    message: `Permission denied. Required: ${permission}`
                });
            }

            req.pharmacyUser = pharmacyUser;
            req.pharmacyRole = pharmacyUser.pharmacyRole;
            req.pharmacyId = pharmacyUser.pharmacyId;

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({
                success: false,
                message: 'Permission check error',
                error: error.message
            });
        }
    };
};

// Attach pharmacy context to request
exports.attachPharmacyContext = async (req, res, next) => {
    try {
        if (!req.user) {
            return next();
        }

        const pharmacyUser = await PharmacyUser.findOne({
            userId: req.user._id,
            status: 'active',
            isDeleted: false
        }).populate('pharmacyId');

        if (pharmacyUser) {
            req.pharmacyUser = pharmacyUser;
            req.pharmacyRole = pharmacyUser.pharmacyRole;
            // Handle both populated and unpopulated states
            req.pharmacyId = pharmacyUser.pharmacyId._id || pharmacyUser.pharmacyId;
            req.pharmacy = pharmacyUser.pharmacyId._id ? pharmacyUser.pharmacyId : null;
        }

        next();
    } catch (error) {
        console.error('Attach pharmacy context error:', error);
        next();
    }
};
