package com.seatguard.booking.repository;

import com.seatguard.booking.entity.Payment;
import com.seatguard.booking.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByBookingId(UUID bookingId);
    List<Payment> findByUserId(UUID userId);
    Optional<Payment> findByTransactionRef(String transactionRef);
    boolean existsByBookingIdAndStatus(UUID bookingId, PaymentStatus status);
}
