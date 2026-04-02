package com.smartcampus.config;

import com.smartcampus.user.AuthProvider;
import com.smartcampus.user.Role;
import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class TestUsersSeederConfig {

    private static final Logger LOGGER = LoggerFactory.getLogger(TestUsersSeederConfig.class);
    private static final String TEST_PASSWORD = "Password@14";

    @Bean
    @ConditionalOnProperty(prefix = "app.seed", name = "test-users", havingValue = "true")
    CommandLineRunner seedTestUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            createIfMissing(userRepository, passwordEncoder, "admin@SmartCampus.lk", "Test Admin", Role.ADMIN);
            createIfMissing(userRepository, passwordEncoder, "teacnian@SmartCampus.lk", "Test Technician", Role.TECHNICIAN);
            createIfMissing(userRepository, passwordEncoder, "student@SmartCampus.lk", "Test Student", Role.STUDENT);
            LOGGER.info("Test users seeding completed. Shared password: {}", TEST_PASSWORD);
        };
    }

    private void createIfMissing(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            String email,
            String name,
            Role role) {
        String normalizedEmail = normalizeEmail(email);

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            LOGGER.info("Test user already exists: {}", normalizedEmail);
            return;
        }

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setName(name);
        user.setRole(role);
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setEmailVerified(true);
        user.setForcePasswordChange(false);
        user.setPasswordHash(passwordEncoder.encode(TEST_PASSWORD));

        userRepository.save(user);
        LOGGER.info("Created test user: {} ({})", normalizedEmail, role.name());
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
