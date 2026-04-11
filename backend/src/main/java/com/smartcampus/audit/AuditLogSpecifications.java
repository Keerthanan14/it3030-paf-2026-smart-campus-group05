package com.smartcampus.audit;

import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.UUID;

public final class AuditLogSpecifications {

    private AuditLogSpecifications() {
    }

    public static Specification<AuditLog> hasEntityType(String entityType) {
        return (root, query, cb) -> {
            if (entityType == null || entityType.isBlank()) {
                return cb.conjunction();
            }
            return cb.equal(cb.lower(root.get("entityType")), entityType.trim().toLowerCase());
        };
    }

    public static Specification<AuditLog> hasAction(String action) {
        return (root, query, cb) -> {
            if (action == null || action.isBlank()) {
                return cb.conjunction();
            }
            return cb.equal(cb.lower(root.get("action")), action.trim().toLowerCase());
        };
    }

    public static Specification<AuditLog> hasUserId(UUID userId) {
        return (root, query, cb) -> userId == null ? cb.conjunction() : cb.equal(root.get("user").get("id"), userId);
    }

    public static Specification<AuditLog> createdAtFrom(LocalDateTime from) {
        return (root, query, cb) -> from == null ? cb.conjunction() : cb.greaterThanOrEqualTo(root.get("createdAt"), from);
    }

    public static Specification<AuditLog> createdAtTo(LocalDateTime to) {
        return (root, query, cb) -> to == null ? cb.conjunction() : cb.lessThanOrEqualTo(root.get("createdAt"), to);
    }
}
