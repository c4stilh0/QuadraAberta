package com.quadraaberta.api.dto;

import com.quadraaberta.api.entity.enums.TipoReserva;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record ReservaRequestDTO(
        @NotNull(message = "O ID da quadra é obrigatório.")
        Long quadraId,

        @NotNull(message = "A data e hora de início são obrigatórias.")
        @Future(message = "A reserva deve ser agendada para uma data futura.")
        LocalDateTime dataInicio,

        @NotNull(message = "A data e hora de término são obrigatórias.")
        @Future(message = "A data de término deve ser posterior ao momento atual.")
        LocalDateTime dataFim,

        @NotNull(message = "O tipo de reserva é obrigatório.")
        TipoReserva tipoReserva
) {}
