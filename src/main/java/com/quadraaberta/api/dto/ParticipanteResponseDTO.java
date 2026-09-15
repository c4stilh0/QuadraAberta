package com.quadraaberta.api.dto;

import com.quadraaberta.api.entity.ParticipantePartida;

import java.time.LocalDateTime;

public record ParticipanteResponseDTO(
        Long id,
        Long usuarioId,
        String nome,
        String fotoUrl,
        String bairro,
        Double reputacao,
        String habilidade,
        Boolean nivelConfirmado,
        LocalDateTime confirmadoEm
) {
    public static ParticipanteResponseDTO fromEntity(ParticipantePartida p) {
        var u = p.getUsuario();
        String habLabel = u.getHabilidadeDeclarada() != null ? u.getHabilidadeDeclarada().getDescricao() : "Jogador Casual";
        boolean confirmado = u.getHabilidadeValidada() != null && u.getTotalAvaliacoesHabilidade() >= 3
                && com.quadraaberta.api.entity.enums.NivelHabilidade.fromPeso(u.getHabilidadeValidada()).equals(u.getHabilidadeDeclarada());

        return new ParticipanteResponseDTO(
                p.getId(),
                u.getId(),
                u.getNome(),
                u.getFotoUrl(),
                p.getBairro(),
                u.getReputacao(),
                habLabel,
                confirmado,
                p.getConfirmadoEm()
        );
    }
}
