package com.quadraaberta.api.dto;

import com.quadraaberta.api.entity.PartidaMatch;
import com.quadraaberta.api.entity.enums.StatusPartida;

import java.time.LocalDateTime;
import java.util.List;

public record PartidaResponseDTO(
        Long id,
        Long criadorId,
        String criadorNome,
        String esporte,
        LocalDateTime dataHora,
        Integer duracaoMinutos,
        Integer minJogadores,
        Integer maxJogadores,
        String descricao,
        String bairroCriador,
        StatusPartida status,
        QuadraResponseDTO quadraEscolhida,
        List<QuadraSugeridaDTO> sugestoesQuadras,
        Double centroideLat,
        Double centroideLng,
        Integer totalParticipantes,
        Integer vagasRestantes,
        List<ParticipanteResponseDTO> participantes,
        Boolean souCriador,
        Boolean estouConfirmado,
        LocalDateTime criadoEm
) {
    public static PartidaResponseDTO fromEntity(
            PartidaMatch p,
            List<QuadraSugeridaDTO> sugestoes,
            Long usuarioAutenticadoId
    ) {
        int total = p.getParticipantes() != null ? p.getParticipantes().size() : 0;
        int vagas = Math.max(0, p.getMaxJogadores() - total);

        List<ParticipanteResponseDTO> partsDTO = p.getParticipantes() != null
                ? p.getParticipantes().stream().map(ParticipanteResponseDTO::fromEntity).toList()
                : List.of();

        boolean souCriador = usuarioAutenticadoId != null && usuarioAutenticadoId.equals(p.getCriador().getId());
        boolean estouConfirmado = usuarioAutenticadoId != null && p.getParticipantes() != null &&
                p.getParticipantes().stream().anyMatch(part -> part.getUsuario().getId().equals(usuarioAutenticadoId));

        QuadraResponseDTO quadraEscolhidaDTO = p.getQuadraEscolhida() != null
                ? QuadraResponseDTO.fromEntity(p.getQuadraEscolhida())
                : null;

        return new PartidaResponseDTO(
                p.getId(),
                p.getCriador().getId(),
                p.getCriador().getNome(),
                p.getEsporte(),
                p.getDataHora(),
                p.getDuracaoMinutos(),
                p.getMinJogadores(),
                p.getMaxJogadores(),
                p.getDescricao(),
                p.getBairroCriador(),
                p.getStatus(),
                quadraEscolhidaDTO,
                sugestoes != null ? sugestoes : List.of(),
                p.getCentroideLat(),
                p.getCentroideLng(),
                total,
                vagas,
                partsDTO,
                souCriador,
                estouConfirmado,
                p.getCriadoEm()
        );
    }
}
