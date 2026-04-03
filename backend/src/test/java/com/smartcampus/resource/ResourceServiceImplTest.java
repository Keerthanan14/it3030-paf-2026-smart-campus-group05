package com.smartcampus.resource;

import com.smartcampus.booking.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResourceServiceImplTest {

    @Mock
    private ResourceRepository resourceRepository;

    @Mock
    private BookingService bookingService;

    private ResourceServiceImpl resourceService;

    @BeforeEach
    void setUp() {
        resourceService = new ResourceServiceImpl(resourceRepository, bookingService);
    }

    @Test
    void resolveVisibleStatus_shouldForceActiveForNonAdmin() {
        ResourceStatus status = resourceService.resolveVisibleStatus("STUDENT", ResourceStatus.OUT_OF_SERVICE);
        assertEquals(ResourceStatus.ACTIVE, status);
    }

    @Test
    void resolveVisibleStatus_shouldAllowAdminRequestedStatus() {
        ResourceStatus status = resourceService.resolveVisibleStatus("ADMIN", ResourceStatus.OUT_OF_SERVICE);
        assertEquals(ResourceStatus.OUT_OF_SERVICE, status);
    }

    @Test
    void isResourceBookable_shouldReturnTrueForActiveResource() {
        UUID id = UUID.randomUUID();
        Resource resource = new Resource();
        resource.setStatus(ResourceStatus.ACTIVE);

        when(resourceRepository.findByIdAndDeletedFalse(id)).thenReturn(Optional.of(resource));

        assertTrue(resourceService.isResourceBookable(id));
    }

    @Test
    void isResourceBookable_shouldReturnFalseForOutOfServiceResource() {
        UUID id = UUID.randomUUID();
        Resource resource = new Resource();
        resource.setStatus(ResourceStatus.OUT_OF_SERVICE);

        when(resourceRepository.findByIdAndDeletedFalse(id)).thenReturn(Optional.of(resource));

        assertFalse(resourceService.isResourceBookable(id));
    }

    @Test
    void isResourceBookable_shouldReturnFalseWhenResourceMissing() {
        UUID id = UUID.randomUUID();

        when(resourceRepository.findByIdAndDeletedFalse(id)).thenReturn(Optional.empty());

        assertFalse(resourceService.isResourceBookable(id));
    }

    @Test
    void updateResourceStatus_shouldTriggerAutoRejectWhenBecomingOutOfService() {
        UUID id = UUID.randomUUID();
        Resource resource = new Resource();
        resource.setId(id);
        resource.setStatus(ResourceStatus.ACTIVE);

        when(resourceRepository.findByIdAndDeletedFalse(id)).thenReturn(Optional.of(resource));
        when(resourceRepository.save(resource)).thenReturn(resource);

        resourceService.updateResourceStatus(id, ResourceStatus.OUT_OF_SERVICE);

        verify(bookingService).autoRejectPendingForResourceOutOfService(eq(id));
    }

    @Test
    void updateResourceStatus_shouldNotTriggerAutoRejectWhenStatusUnchangedOutOfService() {
        UUID id = UUID.randomUUID();
        Resource resource = new Resource();
        resource.setId(id);
        resource.setStatus(ResourceStatus.OUT_OF_SERVICE);

        when(resourceRepository.findByIdAndDeletedFalse(id)).thenReturn(Optional.of(resource));
        when(resourceRepository.save(resource)).thenReturn(resource);

        resourceService.updateResourceStatus(id, ResourceStatus.OUT_OF_SERVICE);

        verify(bookingService, never()).autoRejectPendingForResourceOutOfService(eq(id));
    }
}
