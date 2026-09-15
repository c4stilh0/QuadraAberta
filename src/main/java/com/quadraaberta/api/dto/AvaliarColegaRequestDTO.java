package com.quadraaberta.api.dto;

import com.quadraaberta.api.entity.enums.NivelHabilidade;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AvaliarColegaRequestDTO(
        @NotNull(message = "O ID do usuário avaliado é obrigatório")
        Long avaliadoId,

        @NotNull(message = "A nota de reputação é obrigatória")
        @Min(value = 1, message = "A nota mínima é 1")
        @Max(value = 5, message = "A nota máxima é 5")
        Integer notaReputacao,

        NivelHabilidade nivelHabilidade,

        String comentario
) {}
