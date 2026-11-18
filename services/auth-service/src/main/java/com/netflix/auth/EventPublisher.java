package com.netflix.auth;

import java.time.Instant;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
public class EventPublisher {

    private static final Logger log = LoggerFactory.getLogger(EventPublisher.class);
    private final RabbitTemplate rabbit;

    public EventPublisher(RabbitTemplate rabbit) {
        this.rabbit = rabbit;
    }

    public void userRegistered(User user) {
        try {
            rabbit.convertAndSend(RabbitConfig.EXCHANGE, "user.registered", Map.of(
                    "userId", user.getId(),
                    "username", user.getUsername(),
                    "occurredAt", Instant.now().toString()));
            log.info("Published user.registered for {}", user.getUsername());
        } catch (Exception e) {
            // The broker being down must not break signup.
            log.warn("Could not publish user.registered: {}", e.getMessage());
        }
    }
}
