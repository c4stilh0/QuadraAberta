package com.quadraaberta.api.security;

import com.quadraaberta.api.entity.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class TokenService {

    private final SecretKey chaveAssinatura;
    private final long horasExpiracao;

    public TokenService(
            @Value("${quadraaberta.jwt.secret}") String segredo,
            @Value("${quadraaberta.jwt.expiration-hours:24}") long horasExpiracao
    ) {
        this.chaveAssinatura = Keys.hmacShaKeyFor(segredo.getBytes(StandardCharsets.UTF_8));
        this.horasExpiracao = horasExpiracao;
    }

    public String gerarToken(Usuario usuario) {
        Instant agora = Instant.now();
        Instant expiracao = agora.plus(horasExpiracao, ChronoUnit.HOURS);

        return Jwts.builder()
                .issuer("quadra-aberta-api")
                .subject(usuario.getEmail())
                .claim("id", usuario.getId())
                .claim("nome", usuario.getNome())
                .claim("role", usuario.getRole().name())
                .issuedAt(Date.from(agora))
                .expiration(Date.from(expiracao))
                .signWith(chaveAssinatura)
                .compact();
    }

    public String validarTokenERecuperarSubject(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(chaveAssinatura)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.getSubject();
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    public boolean isTokenExpirado(String token) {
        try {
            Jwts.parser()
                    .verifyWith(chaveAssinatura)
                    .build()
                    .parseSignedClaims(token);
            return false;
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            return true;
        } catch (Exception e) {
            try {
                String[] split = token.split("\\.");
                if (split.length == 3) {
                    String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(split[1]), StandardCharsets.UTF_8);
                    com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(payloadJson);
                    if (node.has("exp")) {
                        long expSec = node.get("exp").asLong();
                        return Instant.now().getEpochSecond() >= expSec;
                    }
                }
            } catch (Exception ignored) {
            }
            return false;
        }
    }
}
