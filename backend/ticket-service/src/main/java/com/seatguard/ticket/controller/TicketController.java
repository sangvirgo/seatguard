package com.seatguard.ticket.controller;

import com.seatguard.ticket.dto.*;
import com.seatguard.ticket.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getUserTickets(
            @RequestHeader("X-User-Id") UUID userId) {
        List<TicketResponse> tickets = ticketService.getUserTickets(userId);
        return ResponseEntity.ok(ApiResponse.success(tickets));
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<ApiResponse<TicketResponse>> getTicket(
            @PathVariable UUID ticketId) {
        TicketResponse ticket = ticketService.getTicket(ticketId);
        return ResponseEntity.ok(ApiResponse.success(ticket));
    }

    @PostMapping("/{ticketId}/check-in")
    public ResponseEntity<ApiResponse<CheckInResponse>> checkInById(
            @PathVariable UUID ticketId) {
        CheckInResponse response = ticketService.checkInById(ticketId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/check-in/by-code")
    public ResponseEntity<ApiResponse<CheckInResponse>> checkInByCode(
            @Valid @RequestBody CheckInRequest request) {
        CheckInResponse response = ticketService.checkInByCode(request.checkInCode());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
