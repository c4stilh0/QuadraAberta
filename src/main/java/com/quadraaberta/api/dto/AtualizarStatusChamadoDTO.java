package com.quadraaberta.api.dto;

import com.quadraaberta.api.entity.enums.StatusChamado;
import jakarta.validation.constraints.NotNull;

public record AtualizarStatusChamadoDTO(
        @NotNull(message = "O novo status do chamado é obrigatório.")
        StatusChamado status
) {}
