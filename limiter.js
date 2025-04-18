const redis = require('redis');
const { RateLimiterRedis } = require('express-rate-limit');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = rateLimiter;