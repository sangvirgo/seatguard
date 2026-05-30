package com.seatguard.ticket.dto;

import jakarta.validation.constraints.NotBlank;

public record CheckInRequest(
        @NotBlank(message = "Check-in code is required")
        String checkInCode
) {}
