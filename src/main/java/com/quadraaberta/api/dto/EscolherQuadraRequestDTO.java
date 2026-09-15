package com.quadraaberta.api.dto;

import jakarta.validation.constraints.NotNull;

public record EscolherQuadraRequestDTO(
        @NotNull(message = "O ID da quadra é obrigatório")
        Long quadraId
) {}
