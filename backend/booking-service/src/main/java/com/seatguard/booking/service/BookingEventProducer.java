package com.seatguard.booking.service;

import com.seatguard.booking.entity.Booking;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class BookingEventProducer {

    private static final Logger log = LoggerFactory.getLogger(BookingEventProducer.class);

    private final KafkaTemplate<String, Map<String, Object>> kafkaTemplate;
    private final String bookingEventsTopic;

    public BookingEventProducer(
            KafkaTemplate<String, Map<String, Object>> kafkaTemplate,
            @Value("${kafka.topics.booking-events:booking-events}") String bookingEventsTopic) {
        this.kafkaTemplate = kafkaTemplate;
        this.bookingEventsTopic = bookingEventsTopic;
    }

    public void publishBookingConfirmed(Booking booking) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", "BOOKING_CONFIRMED");
        event.put("bookingId", booking.getId().toString());
        event.put("userId", booking.getUserId().toString());
        event.put("eventId", booking.getEventId().toString());
        event.put("seatId", booking.getSeatId().toString());
        event.put("totalAmount", booking.getTotalAmount());
        event.put("timestamp", java.time.Instant.now().toString());

        try {
            kafkaTemplate.send(bookingEventsTopic, booking.getId().toString(), event)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Failed to publish BOOKING_CONFIRMED for booking {}: {}", booking.getId(), ex.getMessage());
                        } else {
                            log.info("Published BOOKING_CONFIRMED for booking {} to topic {}", booking.getId(), bookingEventsTopic);
                        }
                    });
        } catch (Exception e) {
            log.error("Error publishing BOOKING_CONFIRMED for booking {}: {}", booking.getId(), e.getMessage());
        }
    }

    public void publishBookingHeld(Booking booking) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", "BOOKING_HELD");
        event.put("bookingId", booking.getId().toString());
        event.put("userId", booking.getUserId().toString());
        event.put("eventId", booking.getEventId().toString());
        event.put("seatId", booking.getSeatId().toString());
        event.put("expiresAt", booking.getExpiresAt().toString());
        event.put("timestamp", java.time.Instant.now().toString());

        try {
            kafkaTemplate.send(bookingEventsTopic, booking.getId().toString(), event)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Failed to publish BOOKING_HELD for booking {}: {}", booking.getId(), ex.getMessage());
                        } else {
                            log.info("Published BOOKING_HELD for booking {} to topic {}", booking.getId(), bookingEventsTopic);
                        }
                    });
        } catch (Exception e) {
            log.error("Error publishing BOOKING_HELD for booking {}: {}", booking.getId(), e.getMessage());
        }
    }

    public void publishBookingCancelled(Booking booking) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", "BOOKING_CANCELLED");
        event.put("bookingId", booking.getId().toString());
        event.put("userId", booking.getUserId().toString());
        event.put("eventId", booking.getEventId().toString());
        event.put("seatId", booking.getSeatId().toString());
        event.put("timestamp", java.time.Instant.now().toString());

        try {
            kafkaTemplate.send(bookingEventsTopic, booking.getId().toString(), event)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Failed to publish BOOKING_CANCELLED for booking {}: {}", booking.getId(), ex.getMessage());
                        } else {
                            log.info("Published BOOKING_CANCELLED for booking {} to topic {}", booking.getId(), bookingEventsTopic);
                        }
                    });
        } catch (Exception e) {
            log.error("Error publishing BOOKING_CANCELLED for booking {}: {}", booking.getId(), e.getMessage());
        }
    }
}
