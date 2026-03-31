package com.smartcampus.config;

import com.smartcampus.security.JwtTokenProvider;
import com.smartcampus.security.AuthUserPrincipal;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenProvider jwtTokenProvider;

    public WebSocketConfig(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/queue", "/topic");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .setHandshakeHandler(new DefaultHandshakeHandler() {
                    @Override
                    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler, Map<String, Object> attributes) {
                        if (request instanceof ServletServerHttpRequest) {
                            String token = UriComponentsBuilder.fromUri(request.getURI())
                                    .build()
                                    .getQueryParams()
                                    .getFirst("token");

                            if (token != null && jwtTokenProvider.validateToken(token)) {
                                UUID userId = jwtTokenProvider.extractUserId(token);
                                String email = jwtTokenProvider.extractEmail(token);
                                String role = jwtTokenProvider.extractRole(token);
                                
                                AuthUserPrincipal authPrincipal = new AuthUserPrincipal(userId, email, role);
                                
                                return new Principal() {
                                    @Override
                                    public String getName() {
                                        return authPrincipal.userId().toString();
                                    }
                                };
                            }
                        }
                        return null;
                    }
                })
                .withSockJS();
    }
}