package com.miniecommerce.health;

import java.time.Instant;
import java.util.Map;

public record HealthStatusResponse(
        String service,
        String status,
        Instant timestamp,
        Map<String, ComponentStatus> components
) {
    public record ComponentStatus(String status) {
    }
}
