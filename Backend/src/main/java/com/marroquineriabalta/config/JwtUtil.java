package com.marroquineriabalta.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {

    // ⚠️ CAMBIAR ESTA CLAVE EN PRODUCCIÓN - Debe ser única y secreta
    private static final String SECRET_KEY = "TuClaveSecretaSuperSeguraDeAlMenos256BitsParaJWTQuDebeSerUnica123456789";
    private static final long EXPIRATION_TIME = 86400000; // 24 horas en milisegundos

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    public String generateToken(String rut, String correo, String rol) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("correo", correo);
        claims.put("rol", rol);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(rut)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractRut(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractCorreo(String token) {
        return extractAllClaims(token).get("correo", String.class);
    }

    public String extractRol(String token) {
        return extractAllClaims(token).get("rol", String.class);
    }

    public boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    public boolean validateToken(String token, String rut) {
        return (extractRut(token).equals(rut) && !isTokenExpired(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}


