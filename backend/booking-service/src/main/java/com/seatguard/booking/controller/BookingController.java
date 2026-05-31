package com.seatguard.booking.controller;

import com.seatguard.booking.dto.*;
import com.seatguard.booking.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/hold")
    public ResponseEntity<ApiResponse<BookingResponse>> holdSeat(
            @Valid @RequestBody HoldBookingRequest request) {
        UUID userId = getCurrentUserId();
        BookingResponse booking = bookingService.holdSeat(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Seat held successfully", booking));
    }

    @PostMapping("/{bookingId}/pay")
    public ResponseEntity<ApiResponse<BookingResponse>> confirmPayment(
            @PathVariable UUID bookingId,
            @Valid @RequestBody PayBookingRequest request) {
        BookingResponse booking = bookingService.confirmPayment(bookingId, request);
        return ResponseEntity.ok(ApiResponse.ok("Payment confirmed", booking));
    }

    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(@PathVariable UUID bookingId) {
        UUID userId = getCurrentUserId();
        BookingResponse booking = bookingService.cancelBooking(bookingId, userId);
        return ResponseEntity.ok(ApiResponse.ok("Booking cancelled", booking));
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBooking(@PathVariable UUID bookingId) {
        BookingResponse booking = bookingService.getBooking(bookingId);
        return ResponseEntity.ok(ApiResponse.ok(booking));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getUserBookings() {
        UUID userId = getCurrentUserId();
        List<BookingResponse> bookings = bookingService.getUserBookings(userId);
        return ResponseEntity.ok(ApiResponse.ok(bookings));
    }

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() != null) {
            return UUID.fromString(auth.getPrincipal().toString());
        }
        throw new RuntimeException("User not authenticated");
    }
}
