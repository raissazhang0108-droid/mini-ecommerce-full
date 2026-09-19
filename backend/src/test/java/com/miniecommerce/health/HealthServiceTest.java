package com.miniecommerce.health;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.sql.Connection;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;

class HealthServiceTest {

    @Test
    void returnsUpWhenMySqlAndRedisAreReachable() throws Exception {
        DataSource dataSource = mock(DataSource.class);
        Connection sqlConnection = mock(Connection.class);
        when(dataSource.getConnection()).thenReturn(sqlConnection);
        when(sqlConnection.isValid(2)).thenReturn(true);

        RedisConnectionFactory redisConnectionFactory = mock(RedisConnectionFactory.class);
        RedisConnection redisConnection = mock(RedisConnection.class);
        when(redisConnectionFactory.getConnection()).thenReturn(redisConnection);
        when(redisConnection.ping()).thenReturn("PONG");

        HealthStatusResponse result = new HealthService(dataSource, redisConnectionFactory).getHealth();

        assertThat(result.status()).isEqualTo("UP");
        assertThat(result.components()).containsKeys("mysql", "redis");
    }
}
