package com.smartcampus.booking;

import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.UUID;

public final class BookingSpecifications {

    private BookingSpecifications() {
    }

    public static Specification<Booking> hasStatus(BookingStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<Booking> hasResourceId(UUID resourceId) {
        return (root, query, cb) -> resourceId == null ? null : cb.equal(root.get("resource").get("id"), resourceId);
    }

    public static Specification<Booking> bookingDateFrom(LocalDate from) {
        return (root, query, cb) -> from == null ? null : cb.greaterThanOrEqualTo(root.get("bookingDate"), from);
    }

    public static Specification<Booking> bookingDateTo(LocalDate to) {
        return (root, query, cb) -> to == null ? null : cb.lessThanOrEqualTo(root.get("bookingDate"), to);
    }

    public static Specification<Booking> hasUserId(UUID userId) {
        return (root, query, cb) -> userId == null ? null : cb.equal(root.get("user").get("id"), userId);
    }
}
