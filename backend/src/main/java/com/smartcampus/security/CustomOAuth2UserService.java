package com.smartcampus.security;

import com.smartcampus.user.AuthProvider;
import com.smartcampus.user.Role;
import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class CustomOAuth2UserService implements org.springframework.security.oauth2.client.userinfo.OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauthUser = delegate.loadUser(userRequest);

        String email = oauthUser.getAttribute("email");
        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException("Google OAuth2 response did not contain email");
        }

        String name = oauthUser.getAttribute("name");
        String picture = oauthUser.getAttribute("picture");

        User user = userRepository.findByEmailIgnoreCase(email)
                .map(existing -> {
                    existing.setName(name != null ? name : existing.getName());
                    if (picture != null && !picture.isBlank()) {
                        existing.setProfilePicture(picture);
                    }
                    existing.setEmailVerified(true);
                    existing.setForcePasswordChange(false);
                    if (existing.getPasswordHash() != null && !existing.getPasswordHash().isBlank()) {
                        existing.setAuthProvider(AuthProvider.BOTH);
                    } else {
                        existing.setAuthProvider(AuthProvider.GOOGLE);
                    }
                    return userRepository.save(existing);
                })
                .orElseGet(() -> {
                    User created = new User();
                    created.setEmail(email);
                    created.setName(name != null ? name : email);
                    created.setProfilePicture(picture);
                    created.setRole(Role.STUDENT);
                    created.setAuthProvider(AuthProvider.GOOGLE);
                    created.setEmailVerified(true);
                    created.setForcePasswordChange(false);
                    return userRepository.save(created);
                });

        Map<String, Object> attributes = new HashMap<>(oauthUser.getAttributes());
        attributes.put("appUserId", user.getId().toString());
        attributes.put("appRole", user.getRole().name());

        return new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())),
                attributes,
                "sub");
    }
}
