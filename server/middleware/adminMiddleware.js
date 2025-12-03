const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'hospital_admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { adminOnly };
