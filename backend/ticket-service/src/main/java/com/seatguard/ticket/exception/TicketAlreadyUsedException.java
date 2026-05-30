package com.seatguard.ticket.exception;

import java.util.UUID;

public class TicketAlreadyUsedException extends RuntimeException {

    public TicketAlreadyUsedException(UUID ticketId) {
        super("Ticket has already been used: " + ticketId);
    }

    public TicketAlreadyUsedException(String message) {
        super(message);
    }
}
