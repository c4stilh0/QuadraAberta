package com.quadraaberta.api.dto;

import com.quadraaberta.api.entity.enums.Role;

public record LoginResponseDTO(
        String token,
        String tipo,
        Long usuarioId,
        String nome,
        String email,
        Role role
) {
    public LoginResponseDTO(String token, Long usuarioId, String nome, String email, Role role) {
        this(token, "Bearer", usuarioId, nome, email, role);
    }
}
