const jwt = require('jsonwebtoken');

const authMiddleware = (requiredRoles = []) => {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Authorization token required' });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error('JWT verification error:', err.message);
                return res.status(403).json({ error: 'Invalid or expired token' });
            }

           
            const user = {
                id: decoded.user_id || decoded.sub,
                role: decoded.role || decoded.roles?.[0] 
            };

            if (!user.role) {
                return res.status(403).json({ error: 'Token missing role information' });
            }

            // Role-based access control
            if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            // Attach user to request
            req.user = user;
            console.log(`Authenticated request from ${user.id} (${user.role})`);
            next();
        });
    };
};

module.exports = authMiddleware;
