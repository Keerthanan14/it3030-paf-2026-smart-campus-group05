package com.smartcampus.resource;

import com.smartcampus.security.JwtTokenProvider;
import com.smartcampus.user.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

@SpringBootTest
@TestPropertySource(properties = {
        "jwt.secret=abcdefghijklmnopqrstuvwxyz123456",
        "jwt.expiration=900000",
        "jwt.refresh-expiration=604800000",
        "app.oauth2.redirect-uri=http://localhost:5173/oauth2/callback",
        "app.auth.debug=false"
})
class ResourceSecurityIntegrationTest {

        private MockMvc mockMvc;

        @Autowired
        private WebApplicationContext webApplicationContext;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

        @BeforeEach
        void setup() {
                mockMvc = MockMvcBuilders
                                .webAppContextSetup(webApplicationContext)
                                .apply(springSecurity())
                                .build();
        }

    @Test
    void getResources_shouldReturn401WithoutToken() throws Exception {
        mockMvc.perform(get("/api/resources"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createResource_shouldReturn403ForStudentRole() throws Exception {
        mockMvc.perform(post("/api/resources")
                        .header("Authorization", "Bearer " + tokenFor(Role.STUDENT))
                        .contentType("application/json")
                        .content("""
                                {
                                  "name": "Main Hall",
                                  "type": "ROOM",
                                  "capacity": 120,
                                  "location": "Block A",
                                  "description": "Large hall",
                                  "availabilityWindows": {}
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteResource_shouldReturn403ForStudentRole() throws Exception {
        mockMvc.perform(delete("/api/resources/{id}", UUID.randomUUID())
                        .header("Authorization", "Bearer " + tokenFor(Role.STUDENT)))
                .andExpect(status().isForbidden());
    }

    private String tokenFor(Role role) {
        return jwtTokenProvider.generateToken(UUID.randomUUID(), role.name().toLowerCase() + "@test.com", role);
    }
}
