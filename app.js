require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const rateLimiter = require('./middlewares/limiter/limiter');
const concurrencyLimiter = require('./middlewares/limiter/concurrency');
const authMiddleware = require('./middlewares/auth');
const adminMiddleware = require('./middlewares/admin');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(rateLimiter);
app.use(concurrencyLimiter);

// Service proxies with corrected ports
app.use('/api/auth', createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:8000', // Auth service
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '' }
}));

app.use('/api/users', authMiddleware(), createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || 'http://localhost:8081', // User service
    changeOrigin: true,
    pathRewrite: { '^/api/users': '' },
    onProxyReq: (proxyReq, req) => {
        if (req.headers['authorization']) {
            proxyReq.setHeader('Authorization', req.headers['authorization']);
        }
    }
}));

app.use('/api/communities', authMiddleware(), createProxyMiddleware({
    target: process.env.COMMUNITY_SERVICE_URL || 'http://localhost:3000', // Community service
    changeOrigin: true,
    pathRewrite: { '^/api/communities': '' },
    onProxyReq: (proxyReq, req) => {
        if (req.headers['authorization']) {
            proxyReq.setHeader('Authorization', req.headers['authorization']);
        }
    }
}));

// Protected community routes
const communityProxy = createProxyMiddleware({
    target: process.env.COMMUNITY_SERVICE_URL || 'http://localhost:3000',
    changeOrigin: true,
    pathRewrite: { '^/api/communities': '/communities' },
    onProxyReq: (proxyReq, req) => {
        if (req.headers['authorization']) {
            proxyReq.setHeader('Authorization', req.headers['authorization']);
        }
    }
});

app.post('/api/communities/:id/join', authMiddleware(['user', 'admin']), communityProxy);
app.post('/api/communities/:id/leave', authMiddleware(['user', 'admin']), communityProxy);
app.get('/api/communities/me', authMiddleware(['user', 'admin']), communityProxy);
app.get('/api/communities/:id/members', authMiddleware(['user', 'admin']), communityProxy);

// Admin-only routes
app.use('/api/admin', 
    authMiddleware(['admin']), 
    adminMiddleware,
    createProxyMiddleware({
        target: process.env.ADMIN_SERVICE_URL || 'http://localhost:3000', // Assuming admin routes are in community service
        changeOrigin: true,
        pathRewrite: { '^/api/admin': '/admin' }
    })
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log('Service mappings:');
    console.log(`- Auth: ${process.env.AUTH_SERVICE_URL || 'http://localhost:8000'}`);
    console.log(`- Users: ${process.env.USER_SERVICE_URL || 'http://localhost:8081'}`);
    console.log(`- Communities: ${process.env.COMMUNITY_SERVICE_URL || 'http://localhost:3000'}`);
});