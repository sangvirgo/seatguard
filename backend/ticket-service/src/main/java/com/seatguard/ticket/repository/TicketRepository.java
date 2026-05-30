package com.seatguard.ticket.repository;

import com.seatguard.ticket.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    List<Ticket> findByUserId(UUID userId);

    Optional<Ticket> findByBookingId(UUID bookingId);

    Optional<Ticket> findByCheckInCode(String code);

    List<Ticket> findByEventId(UUID eventId);
}
