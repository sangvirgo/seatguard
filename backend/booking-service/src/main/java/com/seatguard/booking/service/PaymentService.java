package com.seatguard.booking.service;

import com.seatguard.booking.dto.CreatePaymentRequest;
import com.seatguard.booking.dto.PaymentResponse;
import com.seatguard.booking.entity.*;
import com.seatguard.booking.exception.InvalidBookingStateException;
import com.seatguard.booking.exception.ResourceNotFoundException;
import com.seatguard.booking.payment.PaymentProvider;
import com.seatguard.booking.payment.PaymentResult;
import com.seatguard.booking.repository.BookingRepository;
import com.seatguard.booking.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final BookingService bookingService;
    private final Map<PaymentMethod, PaymentProvider> providers;

    public PaymentService(PaymentRepository paymentRepository,
                          BookingRepository bookingRepository,
                          BookingService bookingService,
                          List<PaymentProvider> providerList) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.bookingService = bookingService;
        this.providers = providerList.stream()
                .collect(Collectors.toMap(PaymentProvider::getMethod, Function.identity()));
    }

    @Transactional
    public PaymentResponse createPayment(UUID bookingId, CreatePaymentRequest request, UUID userId) {
        // Find booking
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        // Verify ownership
        if (!booking.getUserId().equals(userId)) {
            throw new InvalidBookingStateException("You can only pay for your own bookings");
        }

        // Verify booking is in PENDING_PAYMENT
        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new InvalidBookingStateException(
                    "Cannot create payment for booking in status: " + booking.getStatus());
        }

        // Check for existing successful payment (idempotency)
        if (paymentRepository.existsByBookingIdAndStatus(bookingId, PaymentStatus.SUCCESS)) {
            throw new InvalidBookingStateException("Payment already completed for this booking");
        }

        // Get provider
        PaymentProvider provider = providers.get(request.method());
        if (provider == null) {
            throw new InvalidBookingStateException("Unsupported payment method: " + request.method());
        }

        // Create payment entity
        Payment payment = new Payment();
        payment.setBookingId(bookingId);
        payment.setUserId(userId);
        payment.setMethod(request.method());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setAmount(booking.getTotalAmount());
        payment = paymentRepository.save(payment);

        // Initiate payment with provider
        PaymentResult result = provider.initiatePayment(payment);
        if (!result.success()) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setRawResponseJson(result.message());
            paymentRepository.save(payment);
            throw new InvalidBookingStateException("Payment initiation failed: " + result.message());
        }

        payment.setPaymentUrl(result.paymentUrl());
        payment.setProviderOrderId(result.providerOrderId());
        payment = paymentRepository.save(payment);

        log.info("Payment created: id={}, method={}, bookingId={}", payment.getId(), request.method(), bookingId);
        return PaymentResponse.from(payment);
    }

    @Transactional
    public PaymentResponse confirmMockPayment(UUID paymentId, UUID userId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        // Verify ownership or ADMIN
        if (!payment.getUserId().equals(userId)) {
            throw new InvalidBookingStateException("You can only confirm your own payments");
        }

        // Verify payment is PENDING and method is MOCK
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new InvalidBookingStateException("Payment is not in PENDING status: " + payment.getStatus());
        }
        if (payment.getMethod() != PaymentMethod.MOCK) {
            throw new InvalidBookingStateException("Only MOCK payments can be manually confirmed");
        }

        // Mark payment SUCCESS
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setTransactionRef("MOCK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        payment.setPaidAt(java.time.Instant.now());
        payment = paymentRepository.save(payment);

        // Confirm booking (this triggers Kafka BOOKING_CONFIRMED)
        bookingService.confirmPayment(payment.getBookingId(), new com.seatguard.booking.dto.PayBookingRequest("MOCK", null));

        log.info("Mock payment confirmed: id={}, bookingId={}", payment.getId(), payment.getBookingId());
        return PaymentResponse.from(payment);
    }

    @Transactional
    public void handleMomoCallback(String payload) {
        // TODO: Implement MoMo IPN verification and processing
        log.info("MoMo IPN received (not yet implemented)");
    }

    @Transactional
    public void handleVnpayCallback(String payload) {
        // TODO: Implement VNPay IPN verification and processing
        log.info("VNPay IPN received (not yet implemented)");
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPayment(UUID paymentId, UUID userId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        if (!payment.getUserId().equals(userId)) {
            throw new InvalidBookingStateException("You can only view your own payments");
        }

        return PaymentResponse.from(payment);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getUserPayments(UUID userId) {
        return paymentRepository.findByUserId(userId).stream()
                .map(PaymentResponse::from)
                .toList();
    }
}
