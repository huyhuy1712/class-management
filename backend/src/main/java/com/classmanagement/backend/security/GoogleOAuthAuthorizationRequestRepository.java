package com.classmanagement.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class GoogleOAuthAuthorizationRequestRepository
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {
    private static final String CONTEXT_SESSION_KEY = GoogleOAuthAuthorizationRequestRepository.class.getName();
    private final HttpSessionOAuth2AuthorizationRequestRepository delegate =
            new HttpSessionOAuth2AuthorizationRequestRepository();

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return delegate.loadAuthorizationRequest(request);
    }

    @Override
    public void saveAuthorizationRequest(
            OAuth2AuthorizationRequest authorizationRequest,
            HttpServletRequest request,
            HttpServletResponse response) {
        delegate.saveAuthorizationRequest(authorizationRequest, request, response);
        if (authorizationRequest != null) {
            Map<String, String> context = new HashMap<>();
            copyAttribute(authorizationRequest, context, "app_intent");
            copyAttribute(authorizationRequest, context, "app_role");
            copyAttribute(authorizationRequest, context, "app_username");
            copyAttribute(authorizationRequest, context, "app_return_to");
            request.getSession(true).setAttribute(CONTEXT_SESSION_KEY, context);
        }
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(
            HttpServletRequest request,
            HttpServletResponse response) {
        return delegate.removeAuthorizationRequest(request, response);
    }

    @SuppressWarnings("unchecked")
    public Map<String, String> consumeContext(HttpServletRequest request) {
        var session = request.getSession(false);
        if (session == null) return Map.of();
        Object context = session.getAttribute(CONTEXT_SESSION_KEY);
        session.removeAttribute(CONTEXT_SESSION_KEY);
        return context instanceof Map<?, ?> ? (Map<String, String>) context : Map.of();
    }

    private void copyAttribute(
            OAuth2AuthorizationRequest authorizationRequest,
            Map<String, String> target,
            String key) {
        Object value = authorizationRequest.getAttribute(key);
        if (value instanceof String text) target.put(key, text);
    }
}
