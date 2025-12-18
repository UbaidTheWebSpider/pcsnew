const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            console.log('Token:', token);

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded:', decoded);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');
            console.log('User found:', req.user ? req.user.email : 'No user');

            return next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        console.log('Authorize middleware - User role:', req.user.role, 'Allowed roles:', roles);
        if (!roles.includes(req.user.role)) {
            console.log('AUTHORIZATION FAILED - Role not allowed');
            return res.status(403).json({
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        console.log('AUTHORIZATION SUCCESS');
        next();
    };
};

module.exports = { protect, authorize };
