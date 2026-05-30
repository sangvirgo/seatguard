package com.seatguard.booking.dto;

import com.seatguard.booking.entity.Payment;
import com.seatguard.booking.entity.PaymentMethod;
import com.seatguard.booking.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentResponse(
    UUID id,
    UUID bookingId,
    UUID userId,
    PaymentMethod method,
    PaymentStatus status,
    BigDecimal amount,
    String paymentUrl,
    String transactionRef,
    Instant paidAt,
    Instant createdAt
) {
    public static PaymentResponse from(Payment payment) {
        return new PaymentResponse(
            payment.getId(),
            payment.getBookingId(),
            payment.getUserId(),
            payment.getMethod(),
            payment.getStatus(),
            payment.getAmount(),
            payment.getPaymentUrl(),
            payment.getTransactionRef(),
            payment.getPaidAt(),
            payment.getCreatedAt()
        );
    }
}
