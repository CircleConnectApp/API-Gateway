const redis = require('redis');
const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));

const concurrencyLimiter = async (req, res, next) => {
    const userKey = req.ip || req.headers['x-forwarded-for'];
    const maxConcurrent = process.env.MAX_CONCURRENT_REQUESTS || 10;
    const expireTime = process.env.CONCURRENCY_EXPIRE || 60; // seconds

    try {
        await client.connect();
        
        const current = await client.incr(`concurrency:${userKey}`);
        
        if (current === 1) {
            await client.expire(`concurrency:${userKey}`, expireTime);
        }

        if (current > maxConcurrent) {
            await client.decr(`concurrency:${userKey}`);
            return res.status(429).json({ error: 'Too many concurrent requests' });
        }

        res.on('finish', async () => {
            await client.decr(`concurrency:${userKey}`);
        });

        next();
    } catch (err) {
        console.error('Concurrency limiter error:', err);
        next(); // fail open
    } finally {
        await client.quit();
    }
};

module.exports = concurrencyLimiter;