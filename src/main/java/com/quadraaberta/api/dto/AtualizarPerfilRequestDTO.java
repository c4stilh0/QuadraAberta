package com.quadraaberta.api.dto;

import com.quadraaberta.api.entity.enums.NivelHabilidade;
import com.quadraaberta.api.entity.enums.ObjetivoUsuario;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AtualizarPerfilRequestDTO(
        @NotBlank(message = "O nome é obrigatório.")
        @Size(max = 120, message = "O nome deve ter no máximo 120 caracteres.")
        String nome,

        @Size(max = 20, message = "O telefone deve ter no máximo 20 caracteres.")
        String telefone,

        @NotNull(message = "O objetivo comunitário é obrigatório.")
        ObjetivoUsuario objetivo,

        NivelHabilidade habilidadeDeclarada
) {}

