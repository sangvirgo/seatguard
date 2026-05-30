package com.seatguard.ticket.exception;

import java.util.UUID;

public class TicketNotFoundException extends RuntimeException {

    public TicketNotFoundException(UUID ticketId) {
        super("Ticket not found with id: " + ticketId);
    }

    public TicketNotFoundException(String message) {
        super(message);
    }
}
