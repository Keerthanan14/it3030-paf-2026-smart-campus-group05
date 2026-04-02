package com.smartcampus.booking;

import com.smartcampus.exception.BookingBadRequestException;
import com.smartcampus.exception.BookingConflictException;
import com.smartcampus.exception.BookingForbiddenException;
import com.smartcampus.exception.BookingNotFoundException;
import com.smartcampus.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class BookingExceptionMappingTest {

    private MockMvc mockMvc;

        @Mock
    private BookingService bookingService;

        @InjectMocks
        private BookingController bookingController;

        @BeforeEach
        void setUp() {
                mockMvc = MockMvcBuilders
                                .standaloneSetup(bookingController)
                                .setControllerAdvice(new GlobalExceptionHandler())
                                .build();
        }

    @Test
    void approveBooking_shouldMapNotFoundTo404() throws Exception {
        UUID bookingId = UUID.randomUUID();
        when(bookingService.approveBooking(bookingId))
                .thenThrow(new BookingNotFoundException("Booking not found for id: " + bookingId));

        mockMvc.perform(put("/api/bookings/{id}/approve", bookingId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    void approveBooking_shouldMapConflictTo409() throws Exception {
        UUID bookingId = UUID.randomUUID();
        when(bookingService.approveBooking(bookingId))
                .thenThrow(new BookingConflictException("Cannot approve booking due to schedule conflict"));

        mockMvc.perform(put("/api/bookings/{id}/approve", bookingId))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"));
    }

    @Test
    void approveBooking_shouldMapBadRequestTo400() throws Exception {
        UUID bookingId = UUID.randomUUID();
        when(bookingService.approveBooking(bookingId))
                .thenThrow(new BookingBadRequestException("Only PENDING bookings can be approved"));

        mockMvc.perform(put("/api/bookings/{id}/approve", bookingId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    @Test
    void rejectBooking_shouldMapForbiddenTo403() throws Exception {
        UUID bookingId = UUID.randomUUID();
        when(bookingService.rejectBooking(eq(bookingId), any()))
                .thenThrow(new BookingForbiddenException("You are not allowed to reject this booking"));

        mockMvc.perform(put("/api/bookings/{id}/reject", bookingId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rejectionReason\":\"Not available for this time slot\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }
}
