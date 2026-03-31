package com.smartcampus.security;

import com.smartcampus.user.Role;
import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final String redirectUri;

    public OAuth2SuccessHandler(
            JwtTokenProvider jwtTokenProvider,
            UserRepository userRepository,
            @Value("${app.oauth2.redirect-uri}") String redirectUri) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.redirectUri = redirectUri;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {

        OAuth2User principal = (OAuth2User) authentication.getPrincipal();
        String email = principal.getAttribute("email");
        String appUserId = principal.getAttribute("appUserId");
        String appRole = principal.getAttribute("appRole");

        UUID userId;
        Role role;

        if (appUserId != null && appRole != null) {
            userId = UUID.fromString(appUserId);
            role = Role.valueOf(appRole);
        } else {
            String lookupEmail = email;
            User user = userRepository.findByEmailIgnoreCase(lookupEmail)
                    .orElseThrow(() -> new IllegalStateException("User not found after OAuth login: " + lookupEmail));
            userId = user.getId();
            role = user.getRole();
            if (email == null || email.isBlank()) {
                email = user.getEmail();
            }
        }

        if (email == null || email.isBlank()) {
            throw new IllegalStateException("OAuth login succeeded but email is missing from principal");
        }

        String token = jwtTokenProvider.generateToken(userId, email, role);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userId);

        // Put the refresh token into an HttpOnly cookie
        jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("refresh_token", refreshToken);
        cookie.setHttpOnly(true);
        // cookie.setSecure(true); // Uncomment this in production when using HTTPS
        cookie.setPath("/api/auth/refresh");
        cookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
        response.addCookie(cookie);

        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("token", token)
                .build()
                .toUriString();

        response.sendRedirect(targetUrl);
    }
}
