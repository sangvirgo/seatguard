package com.seatguard.event.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record GenerateSeatsRequest(
    @NotNull(message = "Rows per section is required")
    @Min(value = 1, message = "Must have at least 1 row")
    Integer rowsPerSection,

    @NotNull(message = "Seats per row is required")
    @Min(value = 1, message = "Must have at least 1 seat per row")
    Integer seatsPerRow
) {}
