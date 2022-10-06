const { createClient } = require('redis');
const ApiError = require('../utils/ApiError');

class RedisClient {
  constructor() {
    this.redisConnection = createClient();
    this.redisConnection.on('error', (err) => {
      console.error('Redis Client Error', err);
      throw new ApiError('Redis Client Error', err);
    });
    this.redisConnection.connect();
    console.log('Connection Established ');
  }
  getValue(key) {
    try {
      return this.redisConnection.get(key);
    } catch (e) {
      console.error('erorr in get cache');
    }
  }
  setValue(key, value) {
    try {
      this.redisConnection.set(key, value);
    } catch (e) {
      console.error('erorr in set cache');
    }
  }
  setValues(key, time, value) {
    try {
      this.redisConnection.setEx(key, time, value);
    } catch (e) {
      console.error('erorr in set cache');
    }
  }
  del(key) {
    try {
      this.redisConnection.del(key);
    } catch (e) {
      console.error('erorr in delete cache');
    }
  }
}

class Singleton {
  constructor() {
    console.log('Use Singleton.getInstance()');
  }

  static getInstance() {
    if (!Singleton.instance) {
      Singleton.instance = new RedisClient();
    }
    return Singleton.instance;
  }
}
module.exports = Singleton;
