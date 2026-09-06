package com.quadraaberta.api.dto;

import com.quadraaberta.api.entity.enums.StatusQuadra;
import com.quadraaberta.api.entity.enums.TipoPiso;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record QuadraRequestDTO(
        @NotBlank(message = "O nome da quadra é obrigatório.")
        @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres.")
        String nome,

        @NotBlank(message = "O bairro é obrigatório.")
        @Size(max = 80, message = "O bairro deve ter no máximo 80 caracteres.")
        String bairro,

        @NotBlank(message = "O logradouro é obrigatório.")
        @Size(max = 150, message = "O logradouro deve ter no máximo 150 caracteres.")
        String logradouro,

        @Size(max = 10, message = "CEP deve ter no máximo 10 caracteres.")
        String cep,

        @NotNull(message = "O tipo de piso é obrigatório.")
        TipoPiso tipoPiso,

        @NotNull(message = "Informe se a quadra possui iluminação.")
        Boolean possuiIluminacao,

        @NotNull(message = "O status da quadra é obrigatório.")
        StatusQuadra status
) {}
