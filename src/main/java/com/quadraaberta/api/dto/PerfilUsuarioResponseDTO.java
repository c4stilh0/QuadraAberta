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
        Double reputacao,
        Integer totalAvaliacoesReputacao,
        com.quadraaberta.api.entity.enums.NivelHabilidade habilidadeDeclarada,
        String habilidadeDeclaradaDescricao,
        Double habilidadeValidada,
        String habilidadeValidadaDescricao,
        Integer totalAvaliacoesHabilidade,
        Boolean nivelConfirmadoPelaComunidade,
        Boolean ativo
) {
    public static PerfilUsuarioResponseDTO fromEntity(Usuario usuario) {
        boolean confirmado = false;
        String validadaDescricao = null;
        if (usuario.getHabilidadeValidada() != null) {
            var nivelValidado = com.quadraaberta.api.entity.enums.NivelHabilidade.fromPeso(usuario.getHabilidadeValidada());
            validadaDescricao = nivelValidado.getDescricao();
            confirmado = nivelValidado.equals(usuario.getHabilidadeDeclarada()) && usuario.getTotalAvaliacoesHabilidade() >= 3;
        }

        return new PerfilUsuarioResponseDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTelefone(),
                usuario.getCpf(),
                usuario.getRole(),
                usuario.getFotoUrl(),
                usuario.getObjetivo(),
                usuario.getReputacao(),
                usuario.getTotalAvaliacoesReputacao(),
                usuario.getHabilidadeDeclarada(),
                usuario.getHabilidadeDeclarada() != null ? usuario.getHabilidadeDeclarada().getDescricao() : "Jogador Casual",
                usuario.getHabilidadeValidada(),
                validadaDescricao,
                usuario.getTotalAvaliacoesHabilidade(),
                confirmado,
                usuario.getAtivo()
        );
    }
}
