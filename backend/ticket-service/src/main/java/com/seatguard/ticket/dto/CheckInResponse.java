package com.seatguard.ticket.dto;

import java.util.UUID;

public record CheckInResponse(
        boolean valid,
        UUID ticketId,
        String message,
        String seatInfo
) {}
