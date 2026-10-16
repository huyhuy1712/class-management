package com.classmanagement.backend.security;

import java.io.IOException;

import com.classmanagement.backend.service.ImpersonationService;
import io.jsonwebtoken.JwtException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

        private final JwtService jwtService;
        private final CustomUserDetailsService userDetailsService;
        private final ImpersonationService impersonationService;

        @Override
        protected void doFilterInternal(
                        HttpServletRequest request,
                        HttpServletResponse response,
                        FilterChain filterChain) throws ServletException, IOException {

                String impersonationToken = extractCookie(request, "impersonation_token");
                String token = impersonationToken != null
                                ? impersonationToken
                                : extractCookie(request, "access_token");
                if (token == null) {
                        filterChain.doFilter(request, response);
                        return;
                }

                try {
                        String username = jwtService.extractUsername(token);

                        if (username != null
                                        && SecurityContextHolder.getContext().getAuthentication() == null) {
                                String role = jwtService.extractRole(token);
                                String sessionId = jwtService.extractImpersonationSessionId(token);
                                Long impersonationSessionId = null;
                                UserDetails userDetails;

                                if (impersonationToken != null) {
                                        if (sessionId == null || sessionId.isBlank()) {
                                                throw new BadCredentialsException("Missing impersonation session");
                                        }
                                        impersonationSessionId = Long.valueOf(sessionId);
                                        impersonationService.validateSession(
                                                        impersonationSessionId,
                                                        username,
                                                        role);
                                        userDetails = userDetailsService.loadUserByUsername(username);
                                } else if (sessionId != null) {
                                        throw new BadCredentialsException(
                                                        "Impersonation claim requires impersonation cookie");
                                } else if (role == null || role.isBlank()) {
                                        // Support tokens issued before the role claim was added.
                                        userDetails = userDetailsService.loadUserByUsername(username);
                                } else {
                                        userDetails = org.springframework.security.core.userdetails.User
                                                        .withUsername(username)
                                                        .authorities(role)
                                                        .password("")
                                                        .build();
                                }

                                if (jwtService.isTokenValid(token, userDetails)) {
                                        var authentication = new UsernamePasswordAuthenticationToken(
                                                        userDetails,
                                                        null,
                                                        userDetails.getAuthorities());
                                        if (impersonationSessionId != null) {
                                                authentication.setDetails(new ImpersonationAuthenticationDetails(
                                                                impersonationSessionId));
                                        }
                                        SecurityContextHolder.getContext().setAuthentication(authentication);
                                }
                        }
                } catch (AuthenticationException | JwtException | IllegalArgumentException exception) {
                        SecurityContextHolder.clearContext();
                }

                filterChain.doFilter(request, response);
        }

        private String extractCookie(HttpServletRequest request, String name) {
                if (request.getCookies() == null) {
                        return null;
                }

                for (Cookie cookie : request.getCookies()) {
                        if (name.equals(cookie.getName())) {
                                return cookie.getValue();
                        }
                }

                return null;
        }
}
