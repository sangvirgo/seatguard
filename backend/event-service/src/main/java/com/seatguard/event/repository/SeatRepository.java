package com.seatguard.event.repository;

import com.seatguard.event.entity.Seat;
import com.seatguard.event.entity.SeatStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SeatRepository extends JpaRepository<Seat, UUID> {

    List<Seat> findBySectionId(UUID sectionId);

    List<Seat> findBySectionIdAndStatus(UUID sectionId, SeatStatus status);

    long countBySectionIdAndStatus(UUID sectionId, SeatStatus status);
}
