package com.seatguard.ticket.service;

import com.seatguard.ticket.dto.CheckInResponse;
import com.seatguard.ticket.dto.TicketResponse;
import com.seatguard.ticket.entity.Ticket;
import com.seatguard.ticket.entity.TicketStatus;
import com.seatguard.ticket.exception.TicketAlreadyUsedException;
import com.seatguard.ticket.exception.TicketNotFoundException;
import com.seatguard.ticket.repository.TicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class TicketService {

    private static final String CODE_PREFIX = "SG-";
    private static final int CODE_LENGTH = 8;
    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final TicketRepository ticketRepository;

    public TicketService(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    public TicketResponse issueTicket(UUID bookingId, UUID userId, UUID eventId, UUID seatId, String seatInfo) {
        String checkInCode = generateCheckInCode();
        String qrCodeData = generateQrCodeData(checkInCode);

        Ticket ticket = new Ticket();
        ticket.setBookingId(bookingId);
        ticket.setUserId(userId);
        ticket.setEventId(eventId);
        ticket.setSeatId(seatId);
        ticket.setCheckInCode(checkInCode);
        ticket.setQrCodeData(qrCodeData);
        ticket.setStatus(TicketStatus.VALID);
        ticket.setIssuedAt(LocalDateTime.now());

        Ticket saved = ticketRepository.save(ticket);
        return TicketResponse.from(saved, seatInfo);
    }

    public CheckInResponse checkInByCode(String checkInCode) {
        Ticket ticket = ticketRepository.findByCheckInCode(checkInCode)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found with check-in code: " + checkInCode));

        validateTicketForCheckIn(ticket);

        ticket.setStatus(TicketStatus.USED);
        ticket.setCheckedInAt(LocalDateTime.now());

        Ticket saved = ticketRepository.save(ticket);
        return new CheckInResponse(true, saved.getId(), "Check-in successful", null);
    }

    public CheckInResponse checkInById(UUID ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        validateTicketForCheckIn(ticket);

        ticket.setStatus(TicketStatus.USED);
        ticket.setCheckedInAt(LocalDateTime.now());

        Ticket saved = ticketRepository.save(ticket);
        return new CheckInResponse(true, saved.getId(), "Check-in successful", null);
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getUserTickets(UUID userId) {
        return ticketRepository.findByUserId(userId).stream()
                .map(TicketResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TicketResponse getTicket(UUID ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));
        return TicketResponse.from(ticket);
    }

    private void validateTicketForCheckIn(Ticket ticket) {
        if (ticket.getStatus() != TicketStatus.VALID) {
            throw new TicketAlreadyUsedException(
                    "Ticket is not valid for check-in. Current status: " + ticket.getStatus());
        }
    }

    private String generateCheckInCode() {
        StringBuilder code = new StringBuilder(CODE_PREFIX);
        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
        }
        return code.toString();
    }

    private String generateQrCodeData(String checkInCode) {
        return Base64.getEncoder().encodeToString(
                checkInCode.getBytes(StandardCharsets.UTF_8));
    }
}
