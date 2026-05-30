package com.seatguard.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record HoldBookingRequest(
    @NotNull(message = "eventId is required")
    UUID eventId,

    @NotNull(message = "seatId is required")
    UUID seatId,

    @NotBlank(message = "idempotencyKey is required")
    String idempotencyKey
) {}
