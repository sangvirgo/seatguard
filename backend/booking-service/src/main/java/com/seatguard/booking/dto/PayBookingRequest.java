package com.seatguard.booking.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.Map;

public record PayBookingRequest(
    @NotBlank(message = "paymentMethod is required")
    String paymentMethod,

    Map<String, String> paymentDetails
) {}
