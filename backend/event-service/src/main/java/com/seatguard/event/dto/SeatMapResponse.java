package com.seatguard.event.dto;

import com.seatguard.event.entity.Seat;
import com.seatguard.event.entity.SeatStatus;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record SeatMapResponse(
    UUID eventId,
    List<SeatSection> sections
) {
    public record SeatSection(
        UUID sectionId,
        String sectionName,
        BigDecimal price,
        List<SeatInfo> seats
    ) {}

    public record SeatInfo(
        UUID id,
        String row,
        Integer number,
        SeatStatus status
    ) {
        public static SeatInfo from(Seat seat) {
            return new SeatInfo(
                seat.getId(),
                seat.getRowLabel(),
                seat.getSeatNumber(),
                seat.getStatus()
            );
        }
    }
}
