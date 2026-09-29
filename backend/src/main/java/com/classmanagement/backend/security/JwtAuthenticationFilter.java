package com.classmanagement.backend.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

        private final JwtService jwtService;
        private final CustomUserDetailsService userDetailsService;

        @Override
        protected void doFilterInternal(
                        HttpServletRequest request,
                        HttpServletResponse response,
                        FilterChain filterChain) throws ServletException, IOException {

                String authHeader = request.getHeader("Authorization");

                System.out.println("========== JWT FILTER ==========");
                System.out.println("URI: " + request.getRequestURI());
                System.out.println(
                                "Có Authorization header: " + (authHeader != null));

                // Không có Bearer token
                if (authHeader == null
                                || !authHeader.startsWith("Bearer ")) {

                        System.out.println("Không có Bearer token");
                        System.out.println("==============================");

                        filterChain.doFilter(request, response);
                        return;
                }

                // Lấy JWT, không log token ra terminal
                String token = authHeader.substring(7);

                String username;

                try {

                        // Đọc username từ JWT
                        username = jwtService.extractUsername(token);

                        System.out.println(
                                        "Username trong JWT: " + username);

                } catch (Exception ex) {

                        System.out.println(
                                        "JWT ERROR: "
                                                        + ex.getClass().getSimpleName()
                                                        + " - "
                                                        + ex.getMessage());

                        System.out.println("==============================");

                        filterChain.doFilter(request, response);
                        return;
                }

                // Chỉ authenticate nếu SecurityContext chưa có authentication
                if (username != null
                                && SecurityContextHolder
                                                .getContext()
                                                .getAuthentication() == null) {

                        UserDetails userDetails;

                        try {

                                userDetails = userDetailsService
                                                .loadUserByUsername(username);

                                System.out.println(
                                                "Đã tìm thấy user: "
                                                                + userDetails.getUsername());

                                System.out.println(
                                                "Authorities: "
                                                                + userDetails.getAuthorities());

                        } catch (Exception ex) {

                                System.out.println(
                                                "Không thể load user: "
                                                                + ex.getClass().getSimpleName()
                                                                + " - "
                                                                + ex.getMessage());

                                System.out.println("==============================");

                                filterChain.doFilter(request, response);
                                return;
                        }

                        try {

                                boolean valid = jwtService.isTokenValid(
                                                token,
                                                userDetails);

                                System.out.println(
                                                "JWT VALID: " + valid);

                                if (valid) {

                                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                                        userDetails,
                                                        null,
                                                        userDetails.getAuthorities());

                                        SecurityContextHolder
                                                        .getContext()
                                                        .setAuthentication(authentication);

                                        System.out.println(
                                                        "AUTHENTICATED: "
                                                                        + SecurityContextHolder
                                                                                        .getContext()
                                                                                        .getAuthentication()
                                                                                        .isAuthenticated());
                                }

                        } catch (Exception ex) {

                                System.out.println(
                                                "JWT VALIDATION ERROR: "
                                                                + ex.getClass().getSimpleName()
                                                                + " - "
                                                                + ex.getMessage());
                        }
                }

                System.out.println("==============================");

                filterChain.doFilter(request, response);
        }
}