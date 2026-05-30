package com.seatguard.ticket.dto;

import com.seatguard.ticket.entity.Ticket;
import com.seatguard.ticket.entity.TicketStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record TicketResponse(
        UUID id,
        UUID bookingId,
        UUID eventId,
        UUID seatId,
        String checkInCode,
        String qrCodeData,
        TicketStatus status,
        String seatInfo,
        LocalDateTime issuedAt,
        LocalDateTime checkedInAt
) {
    public static TicketResponse from(Ticket ticket) {
        return new TicketResponse(
                ticket.getId(),
                ticket.getBookingId(),
                ticket.getEventId(),
                ticket.getSeatId(),
                ticket.getCheckInCode(),
                ticket.getQrCodeData(),
                ticket.getStatus(),
                null, // seatInfo is not stored in ticket entity, can be enriched later
                ticket.getIssuedAt(),
                ticket.getCheckedInAt()
        );
    }

    public static TicketResponse from(Ticket ticket, String seatInfo) {
        return new TicketResponse(
                ticket.getId(),
                ticket.getBookingId(),
                ticket.getEventId(),
                ticket.getSeatId(),
                ticket.getCheckInCode(),
                ticket.getQrCodeData(),
                ticket.getStatus(),
                seatInfo,
                ticket.getIssuedAt(),
                ticket.getCheckedInAt()
        );
    }
}
