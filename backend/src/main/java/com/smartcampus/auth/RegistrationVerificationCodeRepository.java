package com.smartcampus.auth;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegistrationVerificationCodeRepository extends JpaRepository<RegistrationVerificationCode, UUID> {
    Optional<RegistrationVerificationCode> findByEmailIgnoreCase(String email);
}