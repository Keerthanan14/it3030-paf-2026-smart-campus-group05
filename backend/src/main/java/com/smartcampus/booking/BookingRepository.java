package com.smartcampus.booking;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID>, JpaSpecificationExecutor<Booking> {

    Optional<Booking> findByIdAndUser_Id(UUID id, UUID userId);

    Page<Booking> findByUser_Id(UUID userId, Pageable pageable);

    Page<Booking> findByUser_IdAndStatus(UUID userId, BookingStatus status, Pageable pageable);

    @Query("""
            SELECT b
            FROM Booking b
            WHERE b.resource.id = :resourceId
              AND b.bookingDate = :bookingDate
              AND b.status = :status
              AND b.startTime < :endTime
              AND b.endTime > :startTime
            """)
    List<Booking> findConflictingBookings(
            @Param("resourceId") UUID resourceId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("status") BookingStatus status,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    @Query("""
            SELECT b
            FROM Booking b
            WHERE b.resource.id = :resourceId
              AND b.bookingDate = :bookingDate
              AND b.status = :status
              AND b.startTime < :endTime
              AND b.endTime > :startTime
              AND b.id <> :excludeBookingId
            """)
    List<Booking> findConflictingBookingsExcludingId(
            @Param("resourceId") UUID resourceId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("status") BookingStatus status,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeBookingId") UUID excludeBookingId
    );

    boolean existsByResource_IdAndBookingDateAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
            UUID resourceId,
            LocalDate bookingDate,
            BookingStatus status,
            LocalTime endTime,
            LocalTime startTime
    );
}
