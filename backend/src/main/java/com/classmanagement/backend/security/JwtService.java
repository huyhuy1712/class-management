package com.classmanagement.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private long jwtExpiration;

    public String generateToken(UserDetails userDetails) {
        Date now = new Date();
        Date expiration = new Date(
                now.getTime() + jwtExpiration
        );

        return createToken(userDetails, now, expiration, null);
    }

    public String generateImpersonationToken(
            UserDetails userDetails,
            Long sessionId,
            Instant expiresAt) {
        return createToken(
                userDetails,
                new Date(),
                Date.from(expiresAt),
                sessionId.toString());
    }

    private String createToken(
            UserDetails userDetails,
            Date issuedAt,
            Date expiration,
            String impersonationSessionId) {
        var builder = Jwts.builder()
                .subject(userDetails.getUsername())
                .claim(
                        "role",
                        userDetails.getAuthorities().stream()
                                .findFirst()
                                .map(authority -> authority.getAuthority())
                                .orElse("ROLE_USER")
                )
                .issuedAt(issuedAt)
                .expiration(expiration);
        if (impersonationSessionId != null) {
            builder.claim("impersonation_session_id", impersonationSessionId);
        }
        return builder.signWith(getSigningKey()).compact();
    }

    public String extractUsername(String token) {
        return extractClaim(
                token,
                Claims::getSubject
        );
    }

    public boolean isTokenValid(
            String token,
            UserDetails userDetails) {

        String username = extractUsername(token);

        return username.equals(userDetails.getUsername())
                && !isTokenExpired(token);
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    public String extractImpersonationSessionId(String token) {
        return extractClaim(token, claims -> claims.get("impersonation_session_id", String.class));
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token)
                .before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(
                token,
                Claims::getExpiration
        );
    }

    private <T> T extractClaim(
            String token,
            Function<Claims, T> claimsResolver) {

        Claims claims = extractAllClaims(token);

        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {

        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {

        byte[] keyBytes =
                Decoders.BASE64.decode(jwtSecret);

        return Keys.hmacShaKeyFor(keyBytes);
    }
}