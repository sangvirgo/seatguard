package com.seatguard.event.repository;

import com.seatguard.event.entity.Event;
import com.seatguard.event.entity.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {

    Page<Event> findByStatus(EventStatus status, Pageable pageable);

    Page<Event> findByStatusAndCategoryContainingIgnoreCase(EventStatus status, String category, Pageable pageable);

    Page<Event> findByStatusAndNameContainingIgnoreCase(EventStatus status, String search, Pageable pageable);
}
