package com.smartcampus.resource;

import com.smartcampus.audit.AuditLogService;
import com.smartcampus.resource.dto.CreateResourceRequest;
import com.smartcampus.resource.dto.PaginatedResourceResponse;
import com.smartcampus.resource.dto.ResourceReportAuditRequest;
import com.smartcampus.resource.dto.ResourceAvailabilityResponse;
import com.smartcampus.resource.dto.ResourceResponse;
import com.smartcampus.resource.dto.StatusUpdateRequest;
import com.smartcampus.resource.dto.UpdateResourceRequest;
import com.smartcampus.security.AuthUserPrincipal;
import jakarta.validation.Valid;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.Link;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private static final UUID RESOURCE_REPORT_ENTITY_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final ResourceService resourceService;
    private final AuditLogService auditLogService;

    public ResourceController(ResourceService resourceService,
                              AuditLogService auditLogService) {
        this.resourceService = resourceService;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getResources(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(required = false) Boolean allowBookings,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            UriComponentsBuilder uriBuilder) {
        String requesterRole = principal != null ? principal.role() : null;
        PaginatedResourceResponse response = resourceService.getResources(type, capacity, location, keyword, status, allowBookings, requesterRole, page, size);

        List<EntityModel<ResourceResponse>> resources = response.content().stream()
                .map(this::toResourceModel)
                .toList();

        String selfHref = uriBuilder
                .path("/api/resources")
                .queryParamIfPresent("type", java.util.Optional.ofNullable(type))
                .queryParamIfPresent("capacity", java.util.Optional.ofNullable(capacity))
                .queryParamIfPresent("location", java.util.Optional.ofNullable(location))
                .queryParamIfPresent("keyword", java.util.Optional.ofNullable(keyword))
                .queryParamIfPresent("status", java.util.Optional.ofNullable(status))
                .queryParamIfPresent("allowBookings", java.util.Optional.ofNullable(allowBookings))
                .queryParam("page", page)
                .queryParam("size", size)
                .build()
                .toUriString();

        Map<String, Object> links = new HashMap<>();
        links.put("self", Map.of("href", selfHref));
        links.put("create", Map.of("href", linkTo(methodOn(ResourceController.class).createResource(null, null)).toUri().toString()));

        String firstHref = uriBuilder
            .replaceQueryParam("page", 0)
            .replaceQueryParam("size", size)
            .build()
            .toUriString();
        links.put("first", Map.of("href", firstHref));

        int lastPage = Math.max(response.totalPages() - 1, 0);
        String lastHref = uriBuilder
            .replaceQueryParam("page", lastPage)
            .replaceQueryParam("size", size)
            .build()
            .toUriString();
        links.put("last", Map.of("href", lastHref));

        if (page > 0) {
            String prevHref = uriBuilder
                .replaceQueryParam("page", page - 1)
                .replaceQueryParam("size", size)
                .build()
                .toUriString();
            links.put("prev", Map.of("href", prevHref));
        }

        if (page + 1 < response.totalPages()) {
            String nextHref = uriBuilder
                .replaceQueryParam("page", page + 1)
                .replaceQueryParam("size", size)
                .build()
                .toUriString();
            links.put("next", Map.of("href", nextHref));
        }

        links.put("report-audit", Map.of("href", linkTo(methodOn(ResourceController.class)
            .auditResourceReportGeneration(null, null)).toUri().toString()));

        Map<String, Object> body = new HashMap<>();
        body.put("_embedded", Map.of("resources", resources));
        body.put("totalElements", response.totalElements());
        body.put("totalPages", response.totalPages());
        body.put("currentPage", response.currentPage());
        body.put("size", response.size());
        body.put("_links", links);

        return ResponseEntity.ok(body);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EntityModel<ResourceResponse>> getResourceById(@PathVariable UUID id) {
        return ResponseEntity.ok(toResourceModel(resourceService.getResourceById(id)));
    }

    @PostMapping("/report/audit")
    public ResponseEntity<Void> auditResourceReportGeneration(@Valid @RequestBody ResourceReportAuditRequest request,
                                                              @AuthenticationPrincipal AuthUserPrincipal principal) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("format", request.format().toUpperCase());
        payload.put("selectedColumnCount", request.selectedColumnCount());

        auditLogService.logAction(
                actorUserId(principal),
                "REPORT_GENERATE",
                "RESOURCE",
                RESOURCE_REPORT_ENTITY_ID,
                null,
                payload
        );

        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<EntityModel<ResourceResponse>> createResource(@Valid @RequestBody CreateResourceRequest request,
                                                                        @AuthenticationPrincipal AuthUserPrincipal principal) {
        ResourceResponse created = resourceService.createResource(request);

        auditLogService.logAction(
                actorUserId(principal),
                "CREATE",
                "RESOURCE",
                created.id(),
                null,
                toAuditSnapshot(created)
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(toResourceModel(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EntityModel<ResourceResponse>> updateResource(@PathVariable UUID id,
                                                                        @AuthenticationPrincipal AuthUserPrincipal principal,
                                                                        @Valid @RequestBody UpdateResourceRequest request) {
        ResourceResponse before = resourceService.getResourceById(id);
        ResourceResponse updated = resourceService.updateResource(id, request);

        auditLogService.logAction(
                actorUserId(principal),
                "UPDATE",
                "RESOURCE",
                updated.id(),
                toAuditSnapshot(before),
                toAuditSnapshot(updated)
        );

        return ResponseEntity.ok(toResourceModel(updated));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<EntityModel<ResourceResponse>> updateResourceStatus(@PathVariable UUID id,
                                                                              @AuthenticationPrincipal AuthUserPrincipal principal,
                                                                              @Valid @RequestBody StatusUpdateRequest request) {
        ResourceResponse before = resourceService.getResourceById(id);
        ResourceResponse updated = resourceService.updateResourceStatus(id, request.status());

        auditLogService.logAction(
                actorUserId(principal),
                "STATUS_CHANGE",
                "RESOURCE",
                updated.id(),
                Map.of("status", before.status().name()),
                Map.of("status", updated.status().name())
        );

        return ResponseEntity.ok(toResourceModel(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable UUID id,
                                               @AuthenticationPrincipal AuthUserPrincipal principal) {
        ResourceResponse before = resourceService.getResourceById(id);
        resourceService.softDeleteResource(id);

        Map<String, Object> newValue = new HashMap<>();
        newValue.put("deleted", true);

        auditLogService.logAction(
                actorUserId(principal),
                "DELETE",
                "RESOURCE",
                id,
                toAuditSnapshot(before),
                newValue
        );

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<ResourceAvailabilityResponse> getResourceAvailability(
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(resourceService.getResourceAvailability(id, from, to));
    }

    private EntityModel<ResourceResponse> toResourceModel(ResourceResponse resource) {
        EntityModel<ResourceResponse> model = EntityModel.of(resource)
                .add(linkTo(methodOn(ResourceController.class).getResourceById(resource.id())).withSelfRel())
                .add(linkTo(methodOn(ResourceController.class).getResources(
                    null, null, null, null, null, null, null, 0, 10, null
                )).withRel("all-resources"));

        if (resource.status() == ResourceStatus.ACTIVE) {
            model.add(Link.of("/api/resources/" + resource.id() + "/availability").withRel("availability"));
            model.add(Link.of("/api/bookings").withRel("book"));
            model.add(Link.of("/api/resources/" + resource.id()).withRel("update"));
            model.add(Link.of("/api/resources/" + resource.id()).withRel("delete"));
        } else {
            model.add(Link.of("/api/resources/" + resource.id() + "/status").withRel("activate"));
        }

        return model;
    }

    private UUID actorUserId(AuthUserPrincipal principal) {
        return principal == null ? null : principal.userId();
    }

    private Map<String, Object> toAuditSnapshot(ResourceResponse resource) {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("name", resource.name());
        snapshot.put("type", resource.type() == null ? null : resource.type().name());
        snapshot.put("status", resource.status() == null ? null : resource.status().name());
        snapshot.put("capacity", resource.capacity());
        snapshot.put("building", resource.building());
        snapshot.put("floor", resource.floor());
        snapshot.put("location", resource.location());
        snapshot.put("allowBookings", resource.allowBookings());
        snapshot.put("allowRequests", resource.allowRequests());
        return snapshot;
    }
}