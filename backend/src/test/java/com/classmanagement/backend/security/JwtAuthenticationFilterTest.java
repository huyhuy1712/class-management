package com.classmanagement.backend.security;

import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.service.ImpersonationService;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtAuthenticationFilterTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void impersonationCookieOverridesExistingAdminSessionAuthentication()
            throws ServletException, IOException {
        JwtService jwtService = mock(JwtService.class);
        CustomUserDetailsService userDetailsService = mock(CustomUserDetailsService.class);
        ImpersonationService impersonationService = mock(ImpersonationService.class);
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(
                jwtService,
                userDetailsService,
                impersonationService);

        UserDetails studentDetails = org.springframework.security.core.userdetails.User
                .withUsername("student")
                .password("")
                .authorities("ROLE_STUDENT")
                .build();
        when(jwtService.extractUsername("impersonation-token")).thenReturn("student");
        when(jwtService.extractRole("impersonation-token")).thenReturn("ROLE_STUDENT");
        when(jwtService.extractImpersonationSessionId("impersonation-token")).thenReturn("42");
        when(userDetailsService.loadUserByUsername("student")).thenReturn(studentDetails);
        when(jwtService.isTokenValid("impersonation-token", studentDetails)).thenReturn(true);
        when(impersonationService.validateSession(42L, "student", "ROLE_STUDENT"))
                .thenReturn(User.builder()
                        .id(2L)
                        .username("student")
                        .role(UserRole.STUDENT)
                        .build());

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin", null, List.of()));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new jakarta.servlet.http.Cookie(
                "impersonation_token",
                "impersonation-token"));

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        var authentication = SecurityContextHolder.getContext().getAuthentication();
        assertEquals("student", authentication.getName());
        assertEquals("ROLE_STUDENT", authentication.getAuthorities().iterator().next().getAuthority());
        assertInstanceOf(ImpersonationAuthenticationDetails.class, authentication.getDetails());
        assertEquals(42L, ((ImpersonationAuthenticationDetails) authentication.getDetails()).sessionId());
    }
}
