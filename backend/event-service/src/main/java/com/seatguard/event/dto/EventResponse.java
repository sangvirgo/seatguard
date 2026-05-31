package com.seatguard.event.dto;

import com.seatguard.event.entity.Event;
import com.seatguard.event.entity.EventStatus;
import java.time.Instant;
import java.util.UUID;

public record EventResponse(
    UUID id,
    String name,
    String description,
    String venue,
    String category,
    Instant startTime,
    Instant endTime,
    EventStatus status,
    String coverImageUrl,
    Instant createdAt
) {
    public static EventResponse from(Event event) {
        return new EventResponse(
            event.getId(),
            event.getName(),
            event.getDescription(),
            event.getVenue(),
            event.getCategory(),
            event.getStartTime(),
            event.getEndTime(),
            event.getStatus(),
            event.getCoverImageUrl(),
            event.getCreatedAt()
        );
    }
}
