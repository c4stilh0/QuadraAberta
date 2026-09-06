package com.quadraaberta.api.dto;

import com.quadraaberta.api.entity.enums.DiaSemana;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;

public record TurmaSocialRequestDTO(
        @NotNull(message = "O ID da quadra é obrigatório.")
        Long quadraId,

        @NotBlank(message = "A modalidade é obrigatória.")
        @Size(max = 60, message = "A modalidade deve ter no máximo 60 caracteres.")
        String modalidade,

        @NotNull(message = "O dia da semana é obrigatório.")
        DiaSemana diaSemana,

        @NotNull(message = "O horário de início é obrigatório.")
        LocalTime horarioInicio,

        @NotNull(message = "O horário de término é obrigatório.")
        LocalTime horarioFim,

        @NotNull(message = "A capacidade de alunos é obrigatória.")
        @Min(value = 1, message = "A capacidade deve ser de pelo menos 1 aluno.")
        Integer capacidadeAlunos
) {}
