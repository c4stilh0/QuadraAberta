package com.quadraaberta.api.dto;

import com.quadraaberta.api.entity.enums.ObjetivoUsuario;
import com.quadraaberta.api.entity.enums.Role;

public record LoginResponseDTO(
        String token,
        String tipo,
        Long usuarioId,
        String nome,
        String email,
        Role role,
        String fotoUrl,
        ObjetivoUsuario objetivo
) {
    public LoginResponseDTO(String token, Long usuarioId, String nome, String email, Role role, String fotoUrl, ObjetivoUsuario objetivo) {
        this(token, "Bearer", usuarioId, nome, email, role, fotoUrl, objetivo);
    }

    public LoginResponseDTO(String token, Long usuarioId, String nome, String email, Role role) {
        this(token, "Bearer", usuarioId, nome, email, role, null, ObjetivoUsuario.PRATICAR_ESPORTES);
    }
}
