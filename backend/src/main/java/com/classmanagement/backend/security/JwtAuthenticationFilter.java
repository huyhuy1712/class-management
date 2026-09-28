package com.classmanagement.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // 1. Lấy Authorization header
        String authHeader =
                request.getHeader("Authorization");

        // 2. Không có Bearer Token
        if (authHeader == null
                || !authHeader.startsWith("Bearer ")) {

            filterChain.doFilter(request, response);
            return;
        }

        // 3. Bỏ chữ "Bearer "
        String token = authHeader.substring(7);

        String username;

        try {

            // 4. Đọc username từ JWT
            username = jwtService.extractUsername(token);

        } catch (Exception ex) {

            // Token sai / hết hạn / signature sai
            filterChain.doFilter(request, response);
            return;
        }

        // 5. Nếu chưa có authentication
        if (username != null
                && SecurityContextHolder
                .getContext()
                .getAuthentication() == null) {

            UserDetails userDetails =
                    userDetailsService
                            .loadUserByUsername(username);

            // 6. Validate JWT
            if (jwtService.isTokenValid(
                    token,
                    userDetails
            )) {

                // 7. Tạo Authentication
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                // 8. Đưa user vào SecurityContext
                SecurityContextHolder
                        .getContext()
                        .setAuthentication(authentication);
            }
        }

        // 9. Đi tiếp request
        filterChain.doFilter(request, response);
    }
}