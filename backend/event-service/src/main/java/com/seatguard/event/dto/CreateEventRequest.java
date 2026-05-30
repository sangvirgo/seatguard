package com.seatguard.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record CreateEventRequest(
    @NotBlank(message = "Event name is required")
    String name,

    String description,

    @NotBlank(message = "Venue is required")
    String venue,

    @NotBlank(message = "Category is required")
    String category,

    @NotNull(message = "Start time is required")
    Instant startTime,

    @NotNull(message = "End time is required")
    Instant endTime
) {}
