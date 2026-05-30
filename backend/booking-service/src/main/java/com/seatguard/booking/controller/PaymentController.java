package com.seatguard.booking.controller;

import com.seatguard.booking.dto.*;
import com.seatguard.booking.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(
            @RequestParam UUID bookingId,
            @Valid @RequestBody CreatePaymentRequest request) {
        UUID userId = getCurrentUserId();
        PaymentResponse payment = paymentService.createPayment(bookingId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Payment initiated", payment));
    }

    @PostMapping("/{paymentId}/mock/success")
    public ResponseEntity<ApiResponse<PaymentResponse>> confirmMockPayment(@PathVariable UUID paymentId) {
        UUID userId = getCurrentUserId();
        PaymentResponse payment = paymentService.confirmMockPayment(paymentId, userId);
        return ResponseEntity.ok(ApiResponse.ok("Payment confirmed", payment));
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPayment(@PathVariable UUID paymentId) {
        UUID userId = getCurrentUserId();
        PaymentResponse payment = paymentService.getPayment(paymentId, userId);
        return ResponseEntity.ok(ApiResponse.ok(payment));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getMyPayments() {
        UUID userId = getCurrentUserId();
        List<PaymentResponse> payments = paymentService.getUserPayments(userId);
        return ResponseEntity.ok(ApiResponse.ok(payments));
    }

    @PostMapping("/momo/ipn")
    public ResponseEntity<Void> momoCallback(@RequestBody String payload) {
        paymentService.handleMomoCallback(payload);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/vnpay/ipn")
    public ResponseEntity<Void> vnpayCallback(@RequestBody String payload) {
        paymentService.handleVnpayCallback(payload);
        return ResponseEntity.ok().build();
    }

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() != null) {
            return UUID.fromString(auth.getPrincipal().toString());
        }
        throw new RuntimeException("User not authenticated");
    }
}
