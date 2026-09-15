package com.quadraaberta.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ConfirmarPresencaRequestDTO(
        @NotBlank(message = "O bairro do participante é obrigatório")
        String bairro,

        @NotNull(message = "A latitude do participante é obrigatória")
        Double latitude,

        @NotNull(message = "A longitude do participante é obrigatória")
        Double longitude
) {}
