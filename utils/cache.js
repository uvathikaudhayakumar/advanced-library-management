/**
 * Redis Cache & Session Helper
 * Supports graceful degradation when Redis is offline or not configured.
 */
const { createClient } = require('redis');

let redisClient = null;
let isConnected = false;

const REDIS_URL = process.env.REDIS_URL;

if (REDIS_URL) {
  try {
    redisClient = createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            console.warn('Redis reconnection limit reached; operating in memory/fallback mode.');
            return new Error('Redis reconnection limit reached');
          }
          return Math.min(retries * 500, 3000);
        }
      }
    });

    redisClient.on('connect', () => {
      isConnected = true;
      console.log('Redis connected successfully.');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      console.warn('Redis notice:', err.message);
    });

    // Initial connection attempt without blocking startup
    redisClient.connect().catch(err => {
      console.warn('Redis initial connect failed (cache running in fallback mode):', err.message);
    });
  } catch (err) {
    console.warn('Could not initialize Redis client:', err.message);
  }
} else {
  console.log('No REDIS_URL specified; session and caching running with local fallbacks.');
}

async function get(key) {
  if (!isConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

async function set(key, value, ttlSeconds = 300) {
  if (!isConnected || !redisClient) return false;
  try {
    await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
    return true;
  } catch (e) {
    return false;
  }
}

async function del(key) {
  if (!isConnected || !redisClient) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (e) {
    return false;
  }
}

async function delPattern(pattern) {
  if (!isConnected || !redisClient) return false;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys && keys.length) {
      await redisClient.del(keys);
    }
    return true;
  } catch (e) {
    return false;
  }
}

function getClient() {
  return redisClient;
}

function getStatus() {
  return isConnected;
}

module.exports = {
  get,
  set,
  del,
  delPattern,
  getClient,
  getStatus
};
