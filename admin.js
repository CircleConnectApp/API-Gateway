const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication middleware not properly configured' });
    }

    if (req.user.role !== 'admin') {
        console.warn(`Unauthorized admin access attempt by ${req.user.id}`);
        return res.status(403).json({
            error: 'Admin privileges required',
            required: 'admin',
            current: req.user.role
        });
    }

    console.log(`Admin access granted to ${req.user.id}`);
    next();
};

module.exports = adminMiddleware;
