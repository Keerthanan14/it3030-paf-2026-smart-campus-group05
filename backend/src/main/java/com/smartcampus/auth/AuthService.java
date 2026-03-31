package com.smartcampus.auth;

import com.smartcampus.auth.dto.AuthMeResponse;
import com.smartcampus.auth.dto.AuthTokenResponse;
import com.smartcampus.auth.dto.ChangePasswordRequest;
import com.smartcampus.auth.dto.LoginRequest;
import com.smartcampus.auth.dto.MessageResponse;
import com.smartcampus.auth.dto.RegisterCodeRequest;
import com.smartcampus.auth.dto.SetPasswordRequest;
import com.smartcampus.auth.dto.StaffCreateRequest;
import com.smartcampus.auth.dto.StaffCreateResponse;
import com.smartcampus.auth.dto.VerifyCodeRequest;
import com.smartcampus.auth.dto.VerifyCodeResponse;
import com.smartcampus.security.AuthUserPrincipal;
import com.smartcampus.security.JwtTokenProvider;
import com.smartcampus.user.AuthProvider;
import com.smartcampus.user.Role;
import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.smartcampus.notification.EmailService;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String TEMP_PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$";

    private final UserRepository userRepository;
    private final RegistrationVerificationCodeRepository verificationCodeRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final long jwtExpirationMs;
    private final long verificationCodeTtlMinutes;

    public AuthService(
            UserRepository userRepository,
            RegistrationVerificationCodeRepository verificationCodeRepository,
            JwtTokenProvider jwtTokenProvider,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            @Value("${jwt.expiration}") long jwtExpirationMs,
            @Value("${app.auth.verification-code-ttl-minutes:10}") long verificationCodeTtlMinutes) {
        this.userRepository = userRepository;
        this.verificationCodeRepository = verificationCodeRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.jwtExpirationMs = jwtExpirationMs;
        this.verificationCodeTtlMinutes = verificationCodeTtlMinutes;
    }

    @Transactional(readOnly = true)
    public AuthTokenResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Use Google Sign-In for this account");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());
        return new AuthTokenResponse(token, "Bearer", jwtExpirationMs / 1000, refreshToken);
    }
    
    @Transactional(readOnly = true)
    public AuthTokenResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }
        
        java.util.UUID userId = jwtTokenProvider.extractUserId(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
                
        String newAccessToken = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());
        return new AuthTokenResponse(newAccessToken, "Bearer", jwtExpirationMs / 1000, null);
    }

    @Transactional
    public MessageResponse requestRegistrationCode(RegisterCodeRequest request) {
        String email = normalizeEmail(request.email());
        String name = request.name().trim();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        RegistrationVerificationCode codeRecord = verificationCodeRepository.findByEmailIgnoreCase(email)
                .orElseGet(RegistrationVerificationCode::new);

        String code = generateVerificationCode();
        codeRecord.setEmail(email);
        codeRecord.setName(name);
        codeRecord.setCode(code);
        codeRecord.setExpiresAt(LocalDateTime.now().plusMinutes(verificationCodeTtlMinutes));
        codeRecord.setVerified(false);
        codeRecord.setUsed(false);
        verificationCodeRepository.save(codeRecord);

        emailService.sendRegistrationCode(email, name, code);
        return new MessageResponse("Verification code sent.");
    }

    @Transactional
    public VerifyCodeResponse verifyRegistrationCode(VerifyCodeRequest request) {
        String email = normalizeEmail(request.email());
        RegistrationVerificationCode codeRecord = verificationCodeRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No verification request found for this email"));

        validateCode(codeRecord, request.code());
        codeRecord.setVerified(true);
        verificationCodeRepository.save(codeRecord);
        return new VerifyCodeResponse(true);
    }

    @Transactional
    public MessageResponse setRegistrationPassword(SetPasswordRequest request) {
        String email = normalizeEmail(request.email());

        RegistrationVerificationCode codeRecord = verificationCodeRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No verification request found for this email"));

        validateCode(codeRecord, request.code());
        if (!codeRecord.isVerified()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verify the code before setting password");
        }

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        User user = new User();
        user.setEmail(email);
        user.setName(codeRecord.getName());
        user.setRole(Role.STUDENT);
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setEmailVerified(true);
        user.setForcePasswordChange(false);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        userRepository.save(user);

        codeRecord.setUsed(true);
        verificationCodeRepository.save(codeRecord);

        return new MessageResponse("Account created successfully.");
    }

    @Transactional(readOnly = true)
    public AuthMeResponse me(AuthUserPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        User user = userRepository.findById(principal.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        return new AuthMeResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getProfilePicture(),
                user.getRole().name(),
                user.isEmailVerified(),
                user.isForcePasswordChange(),
                user.getCreatedAt());
    }

    public MessageResponse logout() {
        return new MessageResponse("Logged out successfully.");
    }

    @Transactional
    public MessageResponse changePassword(AuthUserPrincipal principal, ChangePasswordRequest request) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        User user = userRepository.findById(principal.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot change password for OAuth account");
        }

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incorrect current password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setForcePasswordChange(false);
        userRepository.save(user);

        return new MessageResponse("Password changed successfully.");
    }

    @Transactional
    public StaffCreateResponse createStaff(StaffCreateRequest request) {
        String email = normalizeEmail(request.email());
        String name = request.name().trim();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        Role role;
        try {
            role = Role.valueOf(request.role().trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be ADMIN or TECHNICIAN");
        }

        if (role != Role.ADMIN && role != Role.TECHNICIAN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be ADMIN or TECHNICIAN");
        }

        String temporaryPassword = generateTemporaryPassword(12);

        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setRole(role);
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setEmailVerified(true);
        user.setForcePasswordChange(true);
        user.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        userRepository.save(user);

        emailService.sendStaffTemporaryPassword(email, name, temporaryPassword, role);

        return new StaffCreateResponse(
                "Staff account created and credentials sent via email.",
                email,
                role.name());
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private void validateCode(RegistrationVerificationCode codeRecord, String inputCode) {
        if (codeRecord.isUsed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification code already used");
        }

        if (codeRecord.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification code expired");
        }

        if (!codeRecord.getCode().equals(inputCode.trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification code");
        }
    }

    private String generateVerificationCode() {
        int value = 100000 + RANDOM.nextInt(900000);
        return Integer.toString(value);
    }

    private String generateTemporaryPassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int index = RANDOM.nextInt(TEMP_PASSWORD_CHARS.length());
            sb.append(TEMP_PASSWORD_CHARS.charAt(index));
        }
        return sb.toString();
    }
}