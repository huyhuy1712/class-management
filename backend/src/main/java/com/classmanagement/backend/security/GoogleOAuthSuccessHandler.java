package com.classmanagement.backend.security;

import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.service.GoogleOAuthAccountService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class GoogleOAuthSuccessHandler implements AuthenticationSuccessHandler {
    private final GoogleOAuthAccountService accounts;
    private final GoogleOAuthAuthorizationRequestRepository authorizationRequests;
    private final JwtService jwtService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.auth.cookie-secure:true}")
    private boolean cookieSecure;

    @Value("${app.auth.cookie-same-site:None}")
    private String cookieSameSite;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {
        Map<String, String> context = authorizationRequests.consumeContext(request);
        OAuth2User googleUser = ((OAuth2AuthenticationToken) authentication).getPrincipal();
        GoogleOAuthAccountService.Result result = accounts.process(googleUser, context);

        if ("login".equals(result.status())) {
            setLoginCookie(response, result.user());
        }

        clearOAuthSession(request);

        UriComponentsBuilder redirectBuilder = UriComponentsBuilder.fromUriString(frontendUrl)
                .path("/oauth/callback")
                .queryParam("status", result.status());
        if ("linked".equals(result.status()) && context.containsKey("app_return_to")) {
            redirectBuilder.queryParam("returnTo", context.get("app_return_to"));
        }
        String redirect = redirectBuilder.build().encode().toUriString();
        response.sendRedirect(redirect);
    }

    private void clearOAuthSession(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }

    private void setLoginCookie(HttpServletResponse response, User user) {
        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash() == null ? "" : user.getPasswordHash(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
        String token = jwtService.generateToken(userDetails);
        response.addHeader("Set-Cookie", org.springframework.http.ResponseCookie.from("access_token", token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(Duration.ofDays(1))
                .build().toString());
        response.addHeader("Set-Cookie", org.springframework.http.ResponseCookie.from("impersonation_token", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(Duration.ZERO)
                .build().toString());
    }
}
