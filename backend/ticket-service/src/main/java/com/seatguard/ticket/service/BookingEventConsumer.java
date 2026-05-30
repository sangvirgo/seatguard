package com.seatguard.ticket.service;

import com.seatguard.ticket.entity.Ticket;
import com.seatguard.ticket.entity.TicketStatus;
import com.seatguard.ticket.repository.TicketRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class BookingEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(BookingEventConsumer.class);

    private final TicketRepository ticketRepository;

    public BookingEventConsumer(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    @KafkaListener(topics = "${kafka.topics.booking-events:booking-events}", groupId = "ticket-service-group")
    public void consumeBookingEvent(Map<String, Object> event) {
        String eventType = (String) event.get("eventType");
        log.info("Received Kafka event: {}", eventType);

        if ("BOOKING_CONFIRMED".equals(eventType)) {
            handleBookingConfirmed(event);
        } else if ("BOOKING_CANCELLED".equals(eventType)) {
            handleBookingCancelled(event);
        } else {
            log.debug("Ignoring event type: {}", eventType);
        }
    }

    private void handleBookingConfirmed(Map<String, Object> event) {
        String bookingIdStr = (String) event.get("bookingId");
        String userIdStr = (String) event.get("userId");
        String eventIdStr = (String) event.get("eventId");
        String seatIdStr = (String) event.get("seatId");

        UUID bookingId = UUID.fromString(bookingIdStr);

        // Idempotency: skip if ticket already exists for this booking
        Optional<Ticket> existing = ticketRepository.findByBookingId(bookingId);
        if (existing.isPresent()) {
            log.info("Ticket already exists for booking {}, skipping", bookingId);
            return;
        }

        // Generate check-in code
        String checkInCode = generateCheckInCode();

        // Create ticket
        Ticket ticket = new Ticket();
        ticket.setBookingId(bookingId);
        ticket.setUserId(UUID.fromString(userIdStr));
        ticket.setEventId(UUID.fromString(eventIdStr));
        ticket.setSeatId(UUID.fromString(seatIdStr));
        ticket.setCheckInCode(checkInCode);
        ticket.setQrCodeData(checkInCode); // Simple QR data = check-in code
        ticket.setSeatInfo("Seat " + seatIdStr.substring(0, 8));
        ticket.setStatus(TicketStatus.VALID);

        ticket = ticketRepository.save(ticket);
        log.info("Ticket issued: id={}, bookingId={}, checkInCode={}", ticket.getId(), bookingId, checkInCode);
    }

    private void handleBookingCancelled(Map<String, Object> event) {
        String bookingIdStr = (String) event.get("bookingId");
        UUID bookingId = UUID.fromString(bookingIdStr);

        Optional<Ticket> existing = ticketRepository.findByBookingId(bookingId);
        if (existing.isPresent()) {
            Ticket ticket = existing.get();
            ticket.setStatus(TicketStatus.CANCELLED);
            ticketRepository.save(ticket);
            log.info("Ticket cancelled for booking: {}", bookingId);
        }
    }

    private String generateCheckInCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder("SG-");
        for (int i = 0; i < 8; i++) {
            sb.append(chars.charAt((int) (Math.random() * chars.length())));
        }
        return sb.toString();
    }
}
