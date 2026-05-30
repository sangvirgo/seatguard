package com.seatguard.booking.dto;

import com.seatguard.booking.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;

public record CreatePaymentRequest(
    @NotNull(message = "Payment method is required")
    PaymentMethod method
) {}
