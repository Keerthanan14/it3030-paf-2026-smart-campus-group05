package com.smartcampus.resource;

import com.smartcampus.resource.dto.CreateResourceRequest;
import com.smartcampus.resource.dto.PaginatedResourceResponse;
import com.smartcampus.resource.dto.ResourceAvailabilityResponse;
import com.smartcampus.resource.dto.ResourceResponse;
import com.smartcampus.resource.dto.StatusUpdateRequest;
import com.smartcampus.resource.dto.UpdateResourceRequest;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @GetMapping
    public ResponseEntity<PaginatedResourceResponse> getResources(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(resourceService.getResources(type, capacity, location, keyword, status, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponse> getResourceById(@PathVariable UUID id) {
        return ResponseEntity.ok(resourceService.getResourceById(id));
    }

    @PostMapping
    public ResponseEntity<ResourceResponse> createResource(@Valid @RequestBody CreateResourceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resourceService.createResource(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResourceResponse> updateResource(@PathVariable UUID id,
                                                           @Valid @RequestBody UpdateResourceRequest request) {
        return ResponseEntity.ok(resourceService.updateResource(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ResourceResponse> updateResourceStatus(@PathVariable UUID id,
                                                                 @Valid @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(resourceService.updateResourceStatus(id, request.status()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable UUID id) {
        resourceService.softDeleteResource(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<ResourceAvailabilityResponse> getResourceAvailability(
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(resourceService.getResourceAvailability(id, from, to));
    }
}