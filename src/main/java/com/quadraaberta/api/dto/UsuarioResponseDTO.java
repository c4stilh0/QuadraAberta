package com.quadraaberta.api.dto;

import com.quadraaberta.api.entity.Usuario;
import com.quadraaberta.api.entity.enums.Role;

public record UsuarioResponseDTO(
        Long id,
        String nome,
        String email,
        String telefone,
        String cpf,
        Role role,
        Boolean ativo
) {
    public static UsuarioResponseDTO fromEntity(Usuario usuario) {
        return new UsuarioResponseDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTelefone(),
                usuario.getCpf(),
                usuario.getRole(),
                usuario.getAtivo()
        );
    }
}
