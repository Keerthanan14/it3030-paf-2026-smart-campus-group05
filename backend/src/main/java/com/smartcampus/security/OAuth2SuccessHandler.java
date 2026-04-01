package com.smartcampus.security;

import com.smartcampus.user.Role;
import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import com.smartcampus.user.AuthProvider;
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
        String name = principal.getAttribute("name");
        String picture = principal.getAttribute("picture");
        String appUserId = principal.getAttribute("appUserId");
        String appRole = principal.getAttribute("appRole");

        User user = null;
        if (appUserId != null && !appUserId.isBlank()) {
            user = userRepository.findById(UUID.fromString(appUserId)).orElse(null);
        }

        if (user == null && email != null && !email.isBlank()) {
            user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        }

        if (user == null) {
            if (email == null || email.isBlank()) {
                throw new IllegalStateException("OAuth login succeeded but email is missing from principal");
            }
            user = new User();
            user.setEmail(email);
            user.setRole(Role.STUDENT);
        }

        if (name != null && !name.isBlank()) {
            user.setName(name);
        } else if (user.getName() == null || user.getName().isBlank()) {
            user.setName(user.getEmail());
        }

        if (picture != null && !picture.isBlank()) {
            user.setProfilePicture(picture);
        }

        user.setEmailVerified(true);
        user.setForcePasswordChange(false);
        if (user.getPasswordHash() != null && !user.getPasswordHash().isBlank()) {
            user.setAuthProvider(AuthProvider.BOTH);
        } else {
            user.setAuthProvider(AuthProvider.GOOGLE);
        }

        user = userRepository.save(user);

        UUID userId = user.getId();
        Role role = user.getRole();
        if (email == null || email.isBlank()) {
            email = user.getEmail();
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
