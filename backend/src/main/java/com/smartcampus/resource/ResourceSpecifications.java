package com.smartcampus.resource;

import org.springframework.data.jpa.domain.Specification;

public final class ResourceSpecifications {

    private ResourceSpecifications() {
    }

    public static Specification<Resource> notDeleted() {
        return (root, query, cb) -> cb.isFalse(root.get("deleted"));
    }

    public static Specification<Resource> hasType(ResourceType type) {
        return (root, query, cb) -> type == null ? cb.conjunction() : cb.equal(root.get("type"), type);
    }

    public static Specification<Resource> hasStatus(ResourceStatus status) {
        return (root, query, cb) -> status == null ? cb.conjunction() : cb.equal(root.get("status"), status);
    }

    public static Specification<Resource> minCapacity(Integer capacity) {
        return (root, query, cb) -> capacity == null ? cb.conjunction() : cb.greaterThanOrEqualTo(root.get("capacity"), capacity);
    }

    public static Specification<Resource> hasLocationLike(String location) {
        return (root, query, cb) -> {
            if (location == null || location.isBlank()) {
                return cb.conjunction();
            }
            return cb.like(cb.lower(root.get("location")), "%" + location.toLowerCase() + "%");
        };
    }

    public static Specification<Resource> hasKeyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return cb.conjunction();
            }
            String pattern = "%" + keyword.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern)
            );
        };
    }
}