package com.smartcampus.resource;

import com.smartcampus.exception.ConflictException;
import com.smartcampus.exception.GlobalExceptionHandler;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.resource.dto.CreateResourceRequest;
import com.smartcampus.resource.dto.ResourceResponse;
import com.smartcampus.resource.dto.StatusUpdateRequest;
import com.smartcampus.resource.dto.UpdateResourceRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ResourceExceptionMappingTest {

    private MockMvc mockMvc;

    @Mock
    private ResourceService resourceService;

    @InjectMocks
    private ResourceController resourceController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(resourceController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void getResourceById_shouldMapNotFoundTo404() throws Exception {
        UUID id = UUID.randomUUID();
        when(resourceService.getResourceById(id))
                .thenThrow(new ResourceNotFoundException("Resource not found for id: " + id));

        mockMvc.perform(get("/api/resources/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    void getAvailability_shouldMapInvalidRangeTo400() throws Exception {
        UUID id = UUID.randomUUID();
        when(resourceService.getResourceAvailability(eq(id), eq(java.time.LocalDate.parse("2026-04-10")), eq(java.time.LocalDate.parse("2026-04-01"))))
                .thenThrow(new IllegalArgumentException("from date must be before or equal to to date"));

        mockMvc.perform(get("/api/resources/{id}/availability", id)
                        .queryParam("from", "2026-04-10")
                        .queryParam("to", "2026-04-01"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    @Test
    void createResource_shouldReturn400WhenValidationFails() throws Exception {
        mockMvc.perform(post("/api/resources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "ab",
                                  "capacity": 0,
                                  "location": "",
                                  "description": "desc"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Validation Error"));
    }

    @Test
    void updateStatus_shouldReturn400WhenStatusMissing() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(patch("/api/resources/{id}/status", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Validation Error"));
    }

    @Test
    void deleteResource_shouldMapConflictTo409() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new ConflictException("Cannot delete resource with active approved bookings in the future"))
                .when(resourceService).softDeleteResource(id);

        mockMvc.perform(delete("/api/resources/{id}", id))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"));
    }

    @Test
    void createAndUpdate_shouldSucceedForValidPayloads() throws Exception {
        UUID id = UUID.randomUUID();
        ResourceResponse response = new ResourceResponse(
                id,
                "Main Hall",
                ResourceType.ROOM,
                120,
                "MAIN",
                1,
                "Block A",
                100,
                50,
                0,
                0,
                true,
                true,
                true,
                true,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                "Large hall",
                Map.of(),
                true,
                true,
                ResourceStatus.ACTIVE,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        when(resourceService.createResource(org.mockito.ArgumentMatchers.any(CreateResourceRequest.class))).thenReturn(response);
        when(resourceService.updateResource(eq(id), org.mockito.ArgumentMatchers.any(UpdateResourceRequest.class))).thenReturn(response);
        when(resourceService.updateResourceStatus(eq(id), eq(ResourceStatus.ACTIVE))).thenReturn(response);

        mockMvc.perform(post("/api/resources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Main Hall",
                                  "type": "ROOM",
                                  "capacity": 120,
                                                                                                                                        "building": "MAIN",
                                                                                                                                        "floor": 1,
                                                                                                                                        "chairCount": 100,
                                                                                                                                        "tableCount": 50,
                                                                                                                                        "hasAc": true,
                                                                                                                                        "hasFan": true,
                                                                                                                                        "hasProjector": true,
                                                                                                                                        "hasSmartboard": true,
                                                                                                                                        "hasCamera": false,
                                                                                                                                        "pcCount": 0,
                                                                                                                                        "equipmentCount": 0,
                                  "description": "Large hall",
                                  "availabilityWindows": {}
                                }
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(put("/api/resources/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Main Hall",
                                  "type": "ROOM",
                                  "capacity": 120,
                                                                                                                                        "building": "MAIN",
                                                                                                                                        "floor": 1,
                                                                                                                                        "chairCount": 100,
                                                                                                                                        "tableCount": 50,
                                                                                                                                        "hasAc": true,
                                                                                                                                        "hasFan": true,
                                                                                                                                        "hasProjector": true,
                                                                                                                                        "hasSmartboard": true,
                                                                                                                                        "hasCamera": false,
                                                                                                                                        "pcCount": 0,
                                                                                                                                        "equipmentCount": 0,
                                  "description": "Large hall",
                                  "availabilityWindows": {},
                                  "status": "ACTIVE"
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/resources/{id}/status", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "ACTIVE"
                                }
                                """))
                .andExpect(status().isOk());
    }
}
