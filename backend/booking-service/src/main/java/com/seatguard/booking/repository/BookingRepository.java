package com.seatguard.booking.repository;

import com.seatguard.booking.entity.Booking;
import com.seatguard.booking.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

    List<Booking> findByUserId(UUID userId);

    List<Booking> findBySeatIdAndStatusIn(UUID seatId, List<BookingStatus> statuses);

    Optional<Booking> findByIdempotencyKey(String idempotencyKey);

    List<Booking> findByStatusAndExpiresAtBefore(BookingStatus status, Instant expiry);

    boolean existsBySeatIdAndStatus(UUID seatId, BookingStatus status);
}
