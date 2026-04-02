package com.smartcampus.resource;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface ResourceRepository extends JpaRepository<Resource, UUID>, JpaSpecificationExecutor<Resource> {
    Optional<Resource> findByIdAndDeletedFalse(UUID id);
}