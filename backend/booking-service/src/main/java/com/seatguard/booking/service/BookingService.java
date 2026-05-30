package com.seatguard.booking.service;

import com.seatguard.booking.dto.*;
import com.seatguard.booking.entity.Booking;
import com.seatguard.booking.entity.BookingStatus;
import com.seatguard.booking.exception.DuplicateBookingException;
import com.seatguard.booking.exception.InvalidBookingStateException;
import com.seatguard.booking.exception.ResourceNotFoundException;
import com.seatguard.booking.repository.BookingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    private final BookingRepository bookingRepository;
    private final RedisLockService redisLockService;

    @Value("${booking.hold-ttl-seconds:300}")
    private long holdTtlSeconds;

    @Value("${booking.default-amount:50.00}")
    private BigDecimal defaultAmount;

    public BookingService(BookingRepository bookingRepository, RedisLockService redisLockService) {
        this.bookingRepository = bookingRepository;
        this.redisLockService = redisLockService;
    }

    @Transactional
    public BookingResponse holdSeat(HoldBookingRequest request, UUID userId) {
        // a. Check idempotency key - if exists, return existing booking
        var existing = bookingRepository.findByIdempotencyKey(request.idempotencyKey());
        if (existing.isPresent()) {
            log.info("Idempotent request detected, returning existing booking: {}", existing.get().getId());
            return BookingResponse.from(existing.get());
        }

        // b. Check no active booking for seat (PENDING_PAYMENT or CONFIRMED)
        List<BookingStatus> activeStatuses = List.of(BookingStatus.PENDING_PAYMENT, BookingStatus.CONFIRMED);
        List<Booking> activeBookings = bookingRepository.findBySeatIdAndStatusIn(request.seatId(), activeStatuses);
        if (!activeBookings.isEmpty()) {
            throw new DuplicateBookingException(
                    "Seat " + request.seatId() + " already has an active booking");
        }

        // c. Acquire Redis lock
        boolean locked = redisLockService.acquireLock(request.seatId().toString(), holdTtlSeconds);
        if (!locked) {
            throw new DuplicateBookingException(
                    "Seat " + request.seatId() + " is currently being booked by another user");
        }

        // d. Create booking with PENDING_PAYMENT status, configured expiry
        Booking booking = new Booking();
        booking.setUserId(userId);
        booking.setEventId(request.eventId());
        booking.setSeatId(request.seatId());
        booking.setStatus(BookingStatus.PENDING_PAYMENT);
        booking.setTotalAmount(defaultAmount);
        booking.setIdempotencyKey(request.idempotencyKey());
        booking.setExpiresAt(Instant.now().plusSeconds(holdTtlSeconds));

        booking = bookingRepository.save(booking);
        log.info("Booking held: id={}, seatId={}, userId={}", booking.getId(), request.seatId(), userId);

        // e. Kafka publish skipped - no Kafka broker configured in dev
        // TODO: publish BOOKING_HELD event when Kafka is available

        return BookingResponse.from(booking);
    }

    @Transactional
    public BookingResponse confirmPayment(UUID bookingId, PayBookingRequest request) {
        // a. Find booking, verify PENDING_PAYMENT
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new InvalidBookingStateException(
                    "Cannot confirm payment for booking in status: " + booking.getStatus());
        }

        // Check if booking has expired
        if (booking.getExpiresAt() != null && Instant.now().isAfter(booking.getExpiresAt())) {
            booking.setStatus(BookingStatus.EXPIRED);
            bookingRepository.save(booking);
            redisLockService.releaseLock(booking.getSeatId().toString());
            throw new InvalidBookingStateException("Booking has expired");
        }

        // b. Update status → CONFIRMED, set paidAt
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setPaidAt(Instant.now());
        booking = bookingRepository.save(booking);
        log.info("Booking confirmed: id={}, paymentMethod={}", bookingId, request.paymentMethod());

        // c. Kafka publish skipped - TODO: publish BOOKING_CONFIRMED

        // Release the lock since booking is confirmed
        redisLockService.releaseLock(booking.getSeatId().toString());

        return BookingResponse.from(booking);
    }

    @Transactional
    public BookingResponse cancelBooking(UUID bookingId, UUID userId) {
        // a. Find booking, verify ownership and PENDING_PAYMENT
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        if (!booking.getUserId().equals(userId)) {
            throw new InvalidBookingStateException("You can only cancel your own bookings");
        }

        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new InvalidBookingStateException(
                    "Cannot cancel booking in status: " + booking.getStatus());
        }

        // b. Update status → CANCELLED, set cancelledAt
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(Instant.now());
        booking = bookingRepository.save(booking);
        log.info("Booking cancelled: id={}, userId={}", bookingId, userId);

        // c. Release Redis lock
        redisLockService.releaseLock(booking.getSeatId().toString());

        return BookingResponse.from(booking);
    }

    @Scheduled(fixedDelayString = "${booking.expiry-check-interval-ms:30000}")
    @Transactional
    public void expireBookings() {
        Instant now = Instant.now();
        List<Booking> expiredBookings = bookingRepository.findByStatusAndExpiresAtBefore(
                BookingStatus.PENDING_PAYMENT, now);

        if (!expiredBookings.isEmpty()) {
            log.info("Expiring {} bookings", expiredBookings.size());
            for (Booking booking : expiredBookings) {
                booking.setStatus(BookingStatus.EXPIRED);
                bookingRepository.save(booking);
                redisLockService.releaseLock(booking.getSeatId().toString());
                log.debug("Expired booking: id={}", booking.getId());
            }
        }
    }

    @Transactional(readOnly = true)
    public BookingResponse getBooking(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));
        return BookingResponse.from(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getUserBookings(UUID userId) {
        return bookingRepository.findByUserId(userId).stream()
                .map(BookingResponse::from)
                .toList();
    }
}
