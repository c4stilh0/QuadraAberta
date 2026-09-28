package com.quadraaberta.api.dto;

import com.quadraaberta.api.entity.MensagemPartida;
import com.quadraaberta.api.entity.enums.TipoMensagemPartida;

import java.time.LocalDateTime;

public record MensagemPartidaResponseDTO(
        Long id,
        Long partidaId,
        Long usuarioId,
        String nomeUsuario,
        String fotoUrl,
        String conteudo,
        TipoMensagemPartida tipo,
        boolean souEu,
        boolean isCriador,
        LocalDateTime criadoEm
) {
    public static MensagemPartidaResponseDTO fromEntity(MensagemPartida m, Long usuarioLogadoId, Long criadorPartidaId) {
        Long autorId = m.getUsuario() != null ? m.getUsuario().getId() : null;
        String nome = m.getUsuario() != null ? m.getUsuario().getNome() : "Sistema";
        String foto = m.getUsuario() != null ? m.getUsuario().getFotoUrl() : null;
        boolean souEu = usuarioLogadoId != null && autorId != null && usuarioLogadoId.equals(autorId);
        boolean isCriador = criadorPartidaId != null && autorId != null && criadorPartidaId.equals(autorId);

        return new MensagemPartidaResponseDTO(
                m.getId(),
                m.getPartida().getId(),
                autorId,
                nome,
                foto,
                m.getConteudo(),
                m.getTipo(),
                souEu,
                isCriador,
                m.getCriadoEm()
        );
    }
}
