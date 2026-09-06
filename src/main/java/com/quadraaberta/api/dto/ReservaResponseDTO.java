package com.quadraaberta.api.dto;

import com.quadraaberta.api.entity.Reserva;
import com.quadraaberta.api.entity.enums.StatusReserva;
import com.quadraaberta.api.entity.enums.TipoReserva;

import java.time.LocalDateTime;

public record ReservaResponseDTO(
        Long id,
        Long quadraId,
        String quadraNome,
        Long usuarioId,
        String usuarioNome,
        LocalDateTime dataInicio,
        LocalDateTime dataFim,
        TipoReserva tipoReserva,
        StatusReserva status,
        LocalDateTime criadoEm
) {
    public static ReservaResponseDTO fromEntity(Reserva reserva) {
        return new ReservaResponseDTO(
                reserva.getId(),
                reserva.getQuadra().getId(),
                reserva.getQuadra().getNome(),
                reserva.getUsuario().getId(),
                reserva.getUsuario().getNome(),
                reserva.getDataInicio(),
                reserva.getDataFim(),
                reserva.getTipoReserva(),
                reserva.getStatus(),
                reserva.getCriadoEm()
        );
    }
}
