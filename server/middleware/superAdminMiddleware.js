const AuditLog = require('../models/AuditLog');

const superAdminOnly = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'super_admin') {
            return res.status(403).json({
                message: 'Access denied. Super Admin privileges required.'
            });
        }

        // Log access attempt if needed, or rely on specific action logs
        next();
    } catch (error) {
        console.error('Super Admin Middleware Error:', error);
        res.status(500).json({ message: 'Server error authorizing super admin' });
    }
};

const logAction = (action) => async (req, res, next) => {
    // Middleware to log successful actions. 
    // Note: This runs BEFORE the controller, so success isn't guaranteed yet.
    // Better to log inside controller or use an interceptor. 
    // For simplicity, we'll strip this out and call AuditLog directly in controllers.
    next();
};

module.exports = { superAdminOnly };
