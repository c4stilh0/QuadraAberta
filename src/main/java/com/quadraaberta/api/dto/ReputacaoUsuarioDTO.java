package com.quadraaberta.api.dto;

import com.quadraaberta.api.entity.Usuario;
import com.quadraaberta.api.entity.enums.NivelHabilidade;

public record ReputacaoUsuarioDTO(
        Long usuarioId,
        Double reputacao,
        Integer totalAvaliacoesReputacao,
        NivelHabilidade habilidadeDeclarada,
        String habilidadeDeclaradaDescricao,
        Double habilidadeValidada,
        String habilidadeValidadaDescricao,
        Integer totalAvaliacoesHabilidade,
        boolean nivelConfirmadoPelaComunidade
) {
    public static ReputacaoUsuarioDTO fromEntity(Usuario u) {
        return fromUsuario(u);
    }

    public static ReputacaoUsuarioDTO fromUsuario(Usuario u) {
        boolean confirmado = false;
        String validadaDescricao = null;
        if (u.getHabilidadeValidada() != null) {
            NivelHabilidade nivelValidado = NivelHabilidade.fromPeso(u.getHabilidadeValidada());
            validadaDescricao = nivelValidado.getDescricao();
            confirmado = nivelValidado.equals(u.getHabilidadeDeclarada()) && u.getTotalAvaliacoesHabilidade() >= 3;
        }

        return new ReputacaoUsuarioDTO(
                u.getId(),
                u.getReputacao(),
                u.getTotalAvaliacoesReputacao(),
                u.getHabilidadeDeclarada(),
                u.getHabilidadeDeclarada() != null ? u.getHabilidadeDeclarada().getDescricao() : "Jogador Casual",
                u.getHabilidadeValidada(),
                validadaDescricao,
                u.getTotalAvaliacoesHabilidade(),
                confirmado
        );
    }
}
