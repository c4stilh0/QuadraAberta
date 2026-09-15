package com.quadraaberta.api.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public record CriarPartidaRequestDTO(
        @NotBlank(message = "O esporte é obrigatório")
        String esporte,

        @NotNull(message = "A data e hora são obrigatórias")
        @Future(message = "A partida deve ser marcada para uma data/hora futura")
        LocalDateTime dataHora,

        @NotNull(message = "A duração em minutos é obrigatória")
        @Positive(message = "A duração deve ser positiva")
        Integer duracaoMinutos,

        @NotNull(message = "O número mínimo de jogadores é obrigatório")
        @Positive(message = "O número mínimo de jogadores deve ser positivo")
        Integer minJogadores,

        @NotNull(message = "O número máximo de jogadores é obrigatório")
        @Positive(message = "O número máximo de jogadores deve ser positivo")
        Integer maxJogadores,

        String descricao,

        @NotBlank(message = "O bairro do criador é obrigatório")
        String bairro,

        @NotNull(message = "A latitude do criador é obrigatória")
        Double latitude,

        @NotNull(message = "A longitude do criador é obrigatória")
        Double longitude
) {}
