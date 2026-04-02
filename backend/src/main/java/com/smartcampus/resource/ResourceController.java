package com.smartcampus.resource;

import com.smartcampus.resource.dto.CreateResourceRequest;
import com.smartcampus.resource.dto.PaginatedResourceResponse;
import com.smartcampus.resource.dto.ResourceAvailabilityResponse;
import com.smartcampus.resource.dto.ResourceResponse;
import com.smartcampus.resource.dto.StatusUpdateRequest;
import com.smartcampus.resource.dto.UpdateResourceRequest;
import jakarta.validation.Valid;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.Link;
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

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getResources(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            UriComponentsBuilder uriBuilder) {
        PaginatedResourceResponse response = resourceService.getResources(type, capacity, location, keyword, status, page, size);

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
                .queryParam("page", page)
                .queryParam("size", size)
                .build()
                .toUriString();

        Map<String, Object> body = new HashMap<>();
        body.put("_embedded", Map.of("resources", resources));
        body.put("totalElements", response.totalElements());
        body.put("totalPages", response.totalPages());
        body.put("currentPage", response.currentPage());
        body.put("size", response.size());
        body.put("_links", Map.of(
                "self", Map.of("href", selfHref),
                "create", Map.of("href", linkTo(methodOn(ResourceController.class).createResource(null)).toUri().toString())
        ));

        return ResponseEntity.ok(body);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EntityModel<ResourceResponse>> getResourceById(@PathVariable UUID id) {
        return ResponseEntity.ok(toResourceModel(resourceService.getResourceById(id)));
    }

    @PostMapping
    public ResponseEntity<EntityModel<ResourceResponse>> createResource(@Valid @RequestBody CreateResourceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(toResourceModel(resourceService.createResource(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EntityModel<ResourceResponse>> updateResource(@PathVariable UUID id,
                                                                        @Valid @RequestBody UpdateResourceRequest request) {
        return ResponseEntity.ok(toResourceModel(resourceService.updateResource(id, request)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<EntityModel<ResourceResponse>> updateResourceStatus(@PathVariable UUID id,
                                                                              @Valid @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(toResourceModel(resourceService.updateResourceStatus(id, request.status())));
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

    private EntityModel<ResourceResponse> toResourceModel(ResourceResponse resource) {
        EntityModel<ResourceResponse> model = EntityModel.of(resource)
                .add(linkTo(methodOn(ResourceController.class).getResourceById(resource.id())).withSelfRel())
                .add(linkTo(methodOn(ResourceController.class).getResources(
                        null, null, null, null, null, 0, 10, null
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
}