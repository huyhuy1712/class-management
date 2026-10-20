package com.classmanagement.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import com.classmanagement.backend.security.ImpersonationAuthenticationDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GoogleAuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {
    private final ClientRegistrationRepository registrations;

    private DefaultOAuth2AuthorizationRequestResolver delegate() {
        return new DefaultOAuth2AuthorizationRequestResolver(registrations, "/oauth2/authorization");
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        return addApplicationContext(delegate().resolve(request), request);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        return addApplicationContext(delegate().resolve(request, clientRegistrationId), request);
    }

    private OAuth2AuthorizationRequest addApplicationContext(
            OAuth2AuthorizationRequest authorizationRequest,
            HttpServletRequest request) {
        if (authorizationRequest == null) return null;

        String intent = request.getParameter("intent");
        if (!"signup".equals(intent) && !"link".equals(intent)) intent = "login";
        String role = request.getParameter("role");
        String returnTo = request.getParameter("returnTo");
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String authenticatedUsername = authentication != null && authentication.isAuthenticated()
                ? authentication.getName()
                : null;
        String username = authentication != null
                && authentication.getDetails() instanceof ImpersonationAuthenticationDetails
                ? null
                : authenticatedUsername;

        String finalIntent = intent;
        return OAuth2AuthorizationRequest.from(authorizationRequest)
                .attributes(attributes -> {
                    attributes.put("app_intent", finalIntent);
                    if ("STUDENT".equals(role) || "TEACHER".equals(role)) {
                        attributes.put("app_role", role);
                    }
                    if ("/student/profile".equals(returnTo) || "/teacher/profile".equals(returnTo)) {
                        attributes.put("app_return_to", returnTo);
                    }
                    if (username != null) attributes.put("app_username", username);
                })
                .build();
    }
}
