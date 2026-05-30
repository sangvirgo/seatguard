package com.seatguard.booking.dto;

import com.seatguard.booking.entity.Booking;
import com.seatguard.booking.entity.BookingStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BookingResponse(
    UUID id,
    UUID eventId,
    UUID seatId,
    BookingStatus status,
    BigDecimal totalAmount,
    Instant expiresAt,
    Instant createdAt,
    Instant paidAt
) {
    public static BookingResponse from(Booking booking) {
        return new BookingResponse(
            booking.getId(),
            booking.getEventId(),
            booking.getSeatId(),
            booking.getStatus(),
            booking.getTotalAmount(),
            booking.getExpiresAt(),
            booking.getCreatedAt(),
            booking.getPaidAt()
        );
    }
}
