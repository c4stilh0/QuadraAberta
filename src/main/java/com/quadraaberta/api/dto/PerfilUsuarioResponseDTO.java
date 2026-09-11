package com.quadraaberta.api.dto;

import com.quadraaberta.api.entity.Usuario;
import com.quadraaberta.api.entity.enums.ObjetivoUsuario;
import com.quadraaberta.api.entity.enums.Role;

public record PerfilUsuarioResponseDTO(
        Long id,
        String nome,
        String email,
        String telefone,
        String cpf,
        Role role,
        String fotoUrl,
        ObjetivoUsuario objetivo,
        Boolean ativo
) {
    public static PerfilUsuarioResponseDTO fromEntity(Usuario usuario) {
        return new PerfilUsuarioResponseDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTelefone(),
                usuario.getCpf(),
                usuario.getRole(),
                usuario.getFotoUrl(),
                usuario.getObjetivo(),
                usuario.getAtivo()
        );
    }
}
