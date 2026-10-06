package com.classmanagement.backend.security;

import java.io.IOException;

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

        @Override
        protected void doFilterInternal(
                        HttpServletRequest request,
                        HttpServletResponse response,
                        FilterChain filterChain) throws ServletException, IOException {

                String token = extractToken(request);
                if (token == null) {
                        filterChain.doFilter(request, response);
                        return;
                }

                try {
                        String username = jwtService.extractUsername(token);

                        if (username != null
                                        && SecurityContextHolder.getContext().getAuthentication() == null) {
                                String role = jwtService.extractRole(token);
                                if (role == null || role.isBlank()) {
                                        filterChain.doFilter(request, response);
                                        return;
                                }

                                UserDetails userDetails =
                                                org.springframework.security.core.userdetails.User
                                                                .withUsername(username)
                                                                .authorities(role)
                                                                .password("")
                                                                .build();

                                if (jwtService.isTokenValid(token, userDetails)) {
                                        SecurityContextHolder.getContext().setAuthentication(
                                                        new UsernamePasswordAuthenticationToken(
                                                                        userDetails,
                                                                        null,
                                                                        userDetails.getAuthorities()));
                                }
                        }
                } catch (Exception ignored) {
                        SecurityContextHolder.clearContext();
                }

                filterChain.doFilter(request, response);
        }

        private String extractToken(HttpServletRequest request) {
                if (request.getCookies() == null) {
                        return null;
                }

                for (Cookie cookie : request.getCookies()) {
                        if ("access_token".equals(cookie.getName())) {
                                return cookie.getValue();
                        }
                }

                return null;
        }
}
