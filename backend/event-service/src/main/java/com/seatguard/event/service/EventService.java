package com.seatguard.event.service;

import com.seatguard.event.dto.*;
import com.seatguard.event.entity.*;
import com.seatguard.event.exception.InvalidEventStateException;
import com.seatguard.event.exception.ResourceNotFoundException;
import com.seatguard.event.repository.EventRepository;
import com.seatguard.event.repository.SeatRepository;
import com.seatguard.event.repository.SectionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.IOException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class EventService {

    private final EventRepository eventRepository;
    private final SectionRepository sectionRepository;
    private final SeatRepository seatRepository;
    private final CloudinaryService cloudinaryService;

    public EventService(EventRepository eventRepository,
                        SectionRepository sectionRepository,
                        SeatRepository seatRepository,
                        CloudinaryService cloudinaryService) {
        this.eventRepository = eventRepository;
        this.sectionRepository = sectionRepository;
        this.seatRepository = seatRepository;
        this.cloudinaryService = cloudinaryService;
    }

    // ─── Event CRUD ──────────────────────────────────────

    public EventResponse createEvent(CreateEventRequest request, UUID createdBy) {
        Event event = new Event();
        event.setName(request.name());
        event.setDescription(request.description());
        event.setVenue(request.venue());
        event.setCategory(request.category());
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());
        event.setCreatedBy(createdBy);
        event.setStatus(EventStatus.DRAFT);

        Event saved = eventRepository.save(event);
        return EventResponse.from(saved);
    }

    public EventResponse updateEvent(UUID eventId, CreateEventRequest request) {
        Event event = getEventOrThrow(eventId);
        event.setName(request.name());
        event.setDescription(request.description());
        event.setVenue(request.venue());
        event.setCategory(request.category());
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());

        Event saved = eventRepository.save(event);
        return EventResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public EventResponse getEvent(UUID eventId) {
        return EventResponse.from(getEventOrThrow(eventId));
    }

    @Transactional(readOnly = true)
    public Page<EventResponse> listPublishedEvents(String category, String search, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return eventRepository.findByStatusAndNameContainingIgnoreCase(EventStatus.PUBLISHED, search, pageable)
                    .map(EventResponse::from);
        }
        if (category != null && !category.isBlank()) {
            return eventRepository.findByStatusAndCategoryContainingIgnoreCase(EventStatus.PUBLISHED, category, pageable)
                    .map(EventResponse::from);
        }
        return eventRepository.findByStatus(EventStatus.PUBLISHED, pageable)
                .map(EventResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<EventResponse> listAllEvents(Pageable pageable) {
        return eventRepository.findAll(pageable).map(EventResponse::from);
    }

    public EventResponse publishEvent(UUID eventId) {
        Event event = getEventOrThrow(eventId);
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new InvalidEventStateException("Only DRAFT events can be published. Current status: " + event.getStatus());
        }
        if (event.getSections().isEmpty()) {
            throw new InvalidEventStateException("Cannot publish event without sections. Add sections first.");
        }

        event.setStatus(EventStatus.PUBLISHED);
        Event saved = eventRepository.save(event);
        return EventResponse.from(saved);
    }

    // ─── Section Management ──────────────────────────────

    public SectionResponse addSection(UUID eventId, CreateSectionRequest request) {
        Event event = getEventOrThrow(eventId);
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new InvalidEventStateException("Can only add sections to DRAFT events.");
        }

        Section section = new Section();
        section.setName(request.name());
        section.setDescription(request.description());
        section.setPrice(request.price());
        section.setCapacity(request.capacity());
        event.addSection(section);

        Section saved = sectionRepository.save(section);
        return SectionResponse.from(saved, saved.getCapacity());
    }

    @Transactional(readOnly = true)
    public List<SectionResponse> listSections(UUID eventId) {
        List<Section> sections = sectionRepository.findByEventId(eventId);
        return sections.stream()
                .map(s -> {
                    long available = seatRepository.countBySectionIdAndStatus(s.getId(), SeatStatus.AVAILABLE);
                    return SectionResponse.from(s, available);
                })
                .collect(Collectors.toList());
    }

    // ─── Seat Generation ─────────────────────────────────

    public List<SeatMapResponse.SeatInfo> generateSeats(UUID eventId, GenerateSeatsRequest request) {
        Event event = getEventOrThrow(eventId);
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new InvalidEventStateException("Can only generate seats for DRAFT events.");
        }

        List<Section> sections = sectionRepository.findByEventId(eventId);
        if (sections.isEmpty()) {
            throw new InvalidEventStateException("No sections found. Add sections before generating seats.");
        }

        List<Seat> allSeats = new ArrayList<>();
        String[] rowLabels = generateRowLabels(request.rowsPerSection());

        for (Section section : sections) {
            // Clear existing seats
            seatRepository.findBySectionId(section.getId()).forEach(seatRepository::delete);
            seatRepository.flush();

            for (int row = 0; row < request.rowsPerSection(); row++) {
                for (int seatNum = 1; seatNum <= request.seatsPerRow(); seatNum++) {
                    Seat seat = new Seat();
                    seat.setSection(section);
                    seat.setRowLabel(rowLabels[row]);
                    seat.setSeatNumber(seatNum);
                    seat.setStatus(SeatStatus.AVAILABLE);
                    allSeats.add(seat);
                }
            }
        }

        List<Seat> saved = seatRepository.saveAll(allSeats);
        return saved.stream().map(SeatMapResponse.SeatInfo::from).collect(Collectors.toList());
    }

    // ─── Seat Map ────────────────────────────────────────

    @Transactional(readOnly = true)
    public SeatMapResponse getSeatMap(UUID eventId) {
        getEventOrThrow(eventId); // verify event exists

        List<Section> sections = sectionRepository.findByEventId(eventId);
        List<SeatMapResponse.SeatSection> seatSections = sections.stream()
                .map(s -> {
                    List<Seat> seats = seatRepository.findBySectionId(s.getId());
                    List<SeatMapResponse.SeatInfo> seatInfos = seats.stream()
                            .map(SeatMapResponse.SeatInfo::from)
                            .collect(Collectors.toList());
                    return new SeatMapResponse.SeatSection(
                            s.getId(), s.getName(), s.getPrice(), seatInfos
                    );
                })
                .collect(Collectors.toList());

        return new SeatMapResponse(eventId, seatSections);
    }

    // ─── Helpers ─────────────────────────────────────────

    private Event getEventOrThrow(UUID eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));
    }

    private String[] generateRowLabels(int count) {
        String[] labels = new String[count];
        for (int i = 0; i < count; i++) {
            if (i < 26) {
                labels[i] = String.valueOf((char) ('A' + i));
            } else {
                labels[i] = "A" + (char) ('A' + (i - 26));
            }
        }
        return labels;
    }

    // ─── Image Management ────────────────────────────────

    public EventResponse updateEventCoverImage(UUID eventId, String imageUrl, String publicId) throws IOException {
        Event event = getEventOrThrow(eventId);

        // Delete old image from Cloudinary if exists
        if (event.getCoverImagePublicId() != null) {
            try {
                cloudinaryService.deleteImage(event.getCoverImagePublicId());
            } catch (Exception e) {
                // Log but don't fail - old image might already be deleted
            }
        }

        event.setCoverImageUrl(imageUrl);
        event.setCoverImagePublicId(publicId);
        Event saved = eventRepository.save(event);
        return EventResponse.from(saved);
    }

    public EventResponse removeEventCoverImage(UUID eventId) throws IOException {
        Event event = getEventOrThrow(eventId);

        if (event.getCoverImagePublicId() != null) {
            cloudinaryService.deleteImage(event.getCoverImagePublicId());
        }

        event.setCoverImageUrl(null);
        event.setCoverImagePublicId(null);
        Event saved = eventRepository.save(event);
        return EventResponse.from(saved);
    }
}
