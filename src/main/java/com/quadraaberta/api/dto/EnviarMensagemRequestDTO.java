package com.quadraaberta.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EnviarMensagemRequestDTO(
        @NotBlank(message = "O conteúdo da mensagem não pode ficar vazio.")
        @Size(max = 500, message = "A mensagem pode conter no máximo 500 caracteres.")
        String conteudo
) {}
