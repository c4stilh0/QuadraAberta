package com.quadraaberta.api.dto;

import com.quadraaberta.api.entity.enums.CategoriaChamado;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ChamadoZeladoriaRequestDTO(
        @NotNull(message = "O ID da quadra é obrigatório.")
        Long quadraId,

        @NotNull(message = "A categoria do chamado é obrigatória.")
        CategoriaChamado categoria,

        @NotBlank(message = "A descrição do problema é obrigatória.")
        @Size(min = 10, max = 2000, message = "A descrição deve ter entre 10 e 2000 caracteres.")
        String descricao
) {}
