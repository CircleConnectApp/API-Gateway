const jwt = require('jsonwebtoken');

const adminMiddleware = (req, res, next) => {
    
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    
    if (req.user.role !== 'admin') {
        console.log(`User role '${req.user.role}' is not admin`);
        return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('Admin access granted');
    next();
};

module.exports = adminMiddleware;