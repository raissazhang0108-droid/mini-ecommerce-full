package com.miniecommerce.health;

import java.sql.Connection;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Service;

@Service
public class HealthService {

    private static final String UP = "UP";
    private static final String DOWN = "DOWN";

    private final DataSource dataSource;
    private final RedisConnectionFactory redisConnectionFactory;

    public HealthService(DataSource dataSource, RedisConnectionFactory redisConnectionFactory) {
        this.dataSource = dataSource;
        this.redisConnectionFactory = redisConnectionFactory;
    }

    public HealthStatusResponse getHealth() {
        Map<String, HealthStatusResponse.ComponentStatus> components = new LinkedHashMap<>();
        components.put("mysql", new HealthStatusResponse.ComponentStatus(checkMySql()));
        components.put("redis", new HealthStatusResponse.ComponentStatus(checkRedis()));

        boolean allUp = components.values().stream().allMatch(component -> UP.equals(component.status()));
        return new HealthStatusResponse(
                "mini-ecommerce-backend",
                allUp ? UP : "DEGRADED",
                Instant.now(),
                components
        );
    }

    private String checkMySql() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(2) ? UP : DOWN;
        } catch (Exception exception) {
            return DOWN;
        }
    }

    private String checkRedis() {
        try (RedisConnection connection = redisConnectionFactory.getConnection()) {
            String pong = connection.ping();
            return "PONG".equalsIgnoreCase(pong) ? UP : DOWN;
        } catch (Exception exception) {
            return DOWN;
        }
    }
}
