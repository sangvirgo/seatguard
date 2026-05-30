package com.seatguard.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record CreateSectionRequest(
    @NotBlank(message = "Section name is required")
    String name,

    String description,

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    BigDecimal price,

    @NotNull(message = "Capacity is required")
    @Positive(message = "Capacity must be positive")
    Integer capacity
) {}
