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
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/auth/login")
    public AuthTokenResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthTokenResponse rawResponse = authService.login(request);
        
        // Put the refresh token into an HttpOnly cookie
        Cookie cookie = new Cookie("refresh_token", rawResponse.refreshToken());
        cookie.setHttpOnly(true);
        // cookie.setSecure(true); // Uncomment this in production when using HTTPS
        cookie.setPath("/api/auth/refresh");
        cookie.setMaxAge(7 * 24 * 60 * 60); // 7 days in seconds
        response.addCookie(cookie);
        
        // Return JSON without the refresh token to keep it out of local storage
        return new AuthTokenResponse(rawResponse.accessToken(), rawResponse.tokenType(), rawResponse.expiresIn(), null);
    }

    @PostMapping("/auth/register/request-code")
    public MessageResponse requestRegistrationCode(@Valid @RequestBody RegisterCodeRequest request) {
        return authService.requestRegistrationCode(request);
    }

    @PostMapping("/auth/register/verify-code")
    public VerifyCodeResponse verifyRegistrationCode(@Valid @RequestBody VerifyCodeRequest request) {
        return authService.verifyRegistrationCode(request);
    }

    @PostMapping("/auth/register/set-password")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse setRegistrationPassword(@Valid @RequestBody SetPasswordRequest request) {
        return authService.setRegistrationPassword(request);
    }

    @GetMapping("/auth/me")
    public AuthMeResponse me(@AuthenticationPrincipal AuthUserPrincipal principal) {
        return authService.me(principal);
    }
    
    @PostMapping("/auth/refresh")
    public AuthTokenResponse refreshToken(@CookieValue(name = "refresh_token", required = false) String refreshToken) {
        if (refreshToken == null) {
            throw new RuntimeException("No refresh token provided");
        }
        return authService.refreshToken(refreshToken);
    }

    @PostMapping("/auth/logout")
    public MessageResponse logout() {
        return authService.logout();
    }

    @PostMapping("/auth/change-password")
    public MessageResponse changePassword(@AuthenticationPrincipal AuthUserPrincipal principal, @Valid @RequestBody ChangePasswordRequest request) {
        return authService.changePassword(principal, request);
    }

    @PostMapping("/admin/users/staff")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public StaffCreateResponse createStaff(@Valid @RequestBody StaffCreateRequest request) {
        return authService.createStaff(request);
    }
}