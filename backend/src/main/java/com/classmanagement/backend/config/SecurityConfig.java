package com.classmanagement.backend.config;

import com.classmanagement.backend.security.JwtAuthenticationFilter;
import com.classmanagement.backend.security.GoogleAuthorizationRequestResolver;
import com.classmanagement.backend.security.GoogleOAuthAuthorizationRequestRepository;
import com.classmanagement.backend.security.GoogleOAuthFailureHandler;
import com.classmanagement.backend.security.GoogleOAuthSuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final GoogleAuthorizationRequestResolver googleAuthorizationRequestResolver;
    private final GoogleOAuthAuthorizationRequestRepository googleAuthorizationRequestRepository;
    private final GoogleOAuthSuccessHandler googleOAuthSuccessHandler;
    private final GoogleOAuthFailureHandler googleOAuthFailureHandler;

    // =========================
    // AUTHENTICATION PROVIDER
    // =========================

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(userDetailsService);

        provider.setPasswordEncoder(passwordEncoder);

        return provider;
    }

    // =========================
    // SECURITY FILTER CHAIN
    // =========================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http

                // CORS
                .cors(Customizer.withDefaults())

                // REST API + JWT nên không dùng CSRF
                .csrf(csrf -> csrf.disable())

                // HTTP session is used only to preserve OAuth2 state during Google's redirect.
                .sessionManagement(session -> session.sessionCreationPolicy(
                        SessionCreationPolicy.IF_REQUIRED))

                // Authorization rules
                .authorizeHttpRequests(auth -> auth

                        // Swagger public
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/uploads/**")
                        .permitAll()

                        // Auth public
                        .requestMatchers(
                                "/api/auth/signup",
                                "/api/auth/signup/pending",
                                "/api/auth/verify-email",
                                "/api/auth/resend-verification-code",
                                "/api/auth/password-reset/**",
                                "/api/auth/login",
                                "/api/auth/logout",
                                "/api/auth/impersonation/stop",
                                "/api/auth/google/enabled",
                                "/oauth2/**",
                                "/login/oauth2/**")
                        .permitAll()

                        // Admin API
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        // Public APIs (Tra cứu học sinh không cần đăng nhập)
                        .requestMatchers(
                                "/api/public/**")
                        .permitAll()

                        // MoMo authenticates this webhook with its HMAC signature.
                        .requestMatchers("/api/billing/momo/ipn")
                        .permitAll()

                        // TẤT CẢ API CÒN LẠI PHẢI LOGIN
                        .anyRequest().authenticated())

                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(endpoint -> endpoint
                                .authorizationRequestResolver(googleAuthorizationRequestResolver)
                                .authorizationRequestRepository(googleAuthorizationRequestRepository))
                        .successHandler(googleOAuthSuccessHandler)
                        .failureHandler(googleOAuthFailureHandler))

                // Authenticate the existing application cookie before a link flow starts OAuth.
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        OAuth2AuthorizationRequestRedirectFilter.class);

        return http.build();
    }

    // =========================
    // AUTHENTICATION MANAGER
    // =========================

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration) throws Exception {

        return configuration.getAuthenticationManager();
    }

    // =========================
    // CORS
    // =========================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "https://class-management-frogh.netlify.app"));

        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"));

        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration);

        return source;
    }
}