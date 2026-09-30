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

                // Nếu không có Bearer token thì bỏ qua filter này
                if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                        filterChain.doFilter(request, response);
                        return;
                }

                // Lấy chuỗi JWT (bỏ qua "Bearer ")
                String token = authHeader.substring(7);
                String username;

                try {
                        // Đọc username từ JWT
                        username = jwtService.extractUsername(token);
                } catch (Exception ex) {
                        // Bỏ qua nếu token lỗi/hết hạn
                        filterChain.doFilter(request, response);
                        return;
                }

                // Chỉ authenticate nếu JWT hợp lệ và SecurityContext chưa được xác thực
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                        UserDetails userDetails;

                        try {
                                userDetails = userDetailsService.loadUserByUsername(username);
                        } catch (Exception ex) {
                                filterChain.doFilter(request, response);
                                return;
                        }

                        try {
                                if (jwtService.isTokenValid(token, userDetails)) {
                                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                                        userDetails,
                                                        null,
                                                        userDetails.getAuthorities());

                                        SecurityContextHolder.getContext().setAuthentication(authentication);
                                }
                        } catch (Exception ex) {
                                // Bỏ qua ngoại lệ xác thực JWT
                        }
                }

                filterChain.doFilter(request, response);
        }
}