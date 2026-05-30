package com.seatguard.event.dto;

import com.seatguard.event.entity.Section;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record SectionResponse(
    UUID id,
    String name,
    String description,
    BigDecimal price,
    Integer capacity,
    long availableSeats
) {
    public static SectionResponse from(Section section, long availableSeats) {
        return new SectionResponse(
            section.getId(),
            section.getName(),
            section.getDescription(),
            section.getPrice(),
            section.getCapacity(),
            availableSeats
        );
    }
}
