package com.seatguard.booking.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class RedisLockService {

    private static final Logger log = LoggerFactory.getLogger(RedisLockService.class);
    private static final String LOCK_PREFIX = "seat:lock:";

    private final StringRedisTemplate redisTemplate;

    public RedisLockService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public boolean acquireLock(String key, long ttlSeconds) {
        String lockKey = LOCK_PREFIX + key;
        try {
            Boolean acquired = redisTemplate.opsForValue()
                    .setIfAbsent(lockKey, "locked", ttlSeconds, TimeUnit.SECONDS);
            boolean result = Boolean.TRUE.equals(acquired);
            if (result) {
                log.debug("Acquired lock for key: {}", lockKey);
            } else {
                log.debug("Failed to acquire lock for key: {} (already held)", lockKey);
            }
            return result;
        } catch (Exception e) {
            log.error("Error acquiring lock for key: {}", lockKey, e);
            return false;
        }
    }

    public void releaseLock(String key) {
        String lockKey = LOCK_PREFIX + key;
        try {
            redisTemplate.delete(lockKey);
            log.debug("Released lock for key: {}", lockKey);
        } catch (Exception e) {
            log.error("Error releasing lock for key: {}", lockKey, e);
        }
    }
}
