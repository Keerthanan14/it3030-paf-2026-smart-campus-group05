package com.smartcampus.config;

import com.smartcampus.user.AuthProvider;
import com.smartcampus.user.Role;
import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class StudentJoinDataSeederConfig {

    private static final Logger LOGGER = LoggerFactory.getLogger(StudentJoinDataSeederConfig.class);
    private static final String TEST_PASSWORD = "Password@14";

    @Bean
    @ConditionalOnProperty(prefix = "app.seed", name = "student-join-data", havingValue = "true")
    CommandLineRunner seedStudentJoinData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            LocalDate startDate = LocalDate.of(2026, 2, 1);
            LocalDate endDate = LocalDate.of(2026, 4, 10);
            long totalDays = endDate.toEpochDay() - startDate.toEpochDay() + 1;

            for (int index = 1; index <= 100; index++) {
                String email = String.format("student%03d@smartcampus.lk", index);
                if (userRepository.existsByEmailIgnoreCase(email)) {
                    LOGGER.info("Student already exists: {}", email);
                    continue;
                }

                LocalDate joinDate = startDate.plusDays((index - 1) % totalDays);
                LocalTime joinTime = LocalTime.of(8 + ((index - 1) % 8), ((index - 1) * 7) % 60);
                LocalDateTime createdAt = LocalDateTime.of(joinDate, joinTime);

                User user = new User();
                user.setEmail(normalizeEmail(email));
                user.setName(String.format("Student %03d", index));
                user.setRole(Role.STUDENT);
                user.setAuthProvider(AuthProvider.LOCAL);
                user.setEmailVerified(true);
                user.setForcePasswordChange(false);
                user.setPasswordHash(passwordEncoder.encode(TEST_PASSWORD));
                user.setCreatedAt(createdAt);
                user.setUpdatedAt(createdAt);

                userRepository.save(user);
            }

            LOGGER.info("Seeded 100 student join records for February to April.");
        };
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}