package com.seatguard.event.controller;

import com.seatguard.event.dto.*;
import com.seatguard.event.service.EventService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    // ─── Event CRUD ──────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EventResponse>> createEvent(
            @Valid @RequestBody CreateEventRequest request) {
        UUID createdBy = getCurrentUserId();
        EventResponse response = eventService.createEvent(request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Event created", response));
    }

    @PutMapping("/{eventId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EventResponse>> updateEvent(
            @PathVariable UUID eventId,
            @Valid @RequestBody CreateEventRequest request) {
        EventResponse response = eventService.updateEvent(eventId, request);
        return ResponseEntity.ok(ApiResponse.ok("Event updated", response));
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<ApiResponse<EventResponse>> getEvent(@PathVariable UUID eventId) {
        EventResponse response = eventService.getEvent(eventId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<EventResponse>>> listEvents(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("startTime").descending());
        Page<EventResponse> events = eventService.listPublishedEvents(category, search, pageRequest);
        return ResponseEntity.ok(ApiResponse.ok(events));
    }

    @PostMapping("/{eventId}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EventResponse>> publishEvent(@PathVariable UUID eventId) {
        EventResponse response = eventService.publishEvent(eventId);
        return ResponseEntity.ok(ApiResponse.ok("Event published", response));
    }

    // ─── Section Management ──────────────────────────────

    @PostMapping("/{eventId}/sections")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SectionResponse>> addSection(
            @PathVariable UUID eventId,
            @Valid @RequestBody CreateSectionRequest request) {
        SectionResponse response = eventService.addSection(eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Section added", response));
    }

    @GetMapping("/{eventId}/sections")
    public ResponseEntity<ApiResponse<List<SectionResponse>>> listSections(
            @PathVariable UUID eventId) {
        List<SectionResponse> sections = eventService.listSections(eventId);
        return ResponseEntity.ok(ApiResponse.ok(sections));
    }

    // ─── Seat Management ─────────────────────────────────

    @PostMapping("/{eventId}/seats/generate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SeatMapResponse.SeatInfo>>> generateSeats(
            @PathVariable UUID eventId,
            @Valid @RequestBody GenerateSeatsRequest request) {
        List<SeatMapResponse.SeatInfo> seats = eventService.generateSeats(eventId, request);
        return ResponseEntity.ok(ApiResponse.ok("Seats generated: " + seats.size(), seats));
    }

    @GetMapping("/{eventId}/seat-map")
    public ResponseEntity<ApiResponse<SeatMapResponse>> getSeatMap(@PathVariable UUID eventId) {
        SeatMapResponse seatMap = eventService.getSeatMap(eventId);
        return ResponseEntity.ok(ApiResponse.ok(seatMap));
    }

    // ─── Helper ──────────────────────────────────────────

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() != null) {
            return UUID.fromString(auth.getPrincipal().toString());
        }
        throw new RuntimeException("User not authenticated");
    }
}
