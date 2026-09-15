package com.quadraaberta.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record AvaliacaoLoteRequestDTO(
        @NotEmpty(message = "Pelo menos uma avaliação deve ser enviada")
        List<@Valid AvaliarColegaRequestDTO> avaliacoes
) {}
