const { RateLimiterRedis } = require('rate-limiter-flexible');
const Redis = require('ioredis');

const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
});

const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    points: 100,  
    duration: 15 * 60,  
    keyPrefix: 'rate-limiter', 
    blockDuration: 60,  
});

// Rate limiter middleware
module.exports = (req, res, next) => {
    rateLimiter.consume(req.ip)  
        .then(() => next())  
        .catch(() => {  // If rate limit is exceeded
            res.status(429).json({ error: 'Too many requests, please try again later.' });
        });
};
