package com.quadraaberta.api.dto;

import com.quadraaberta.api.entity.TurmaSocial;
import com.quadraaberta.api.entity.enums.DiaSemana;

import java.time.LocalTime;

public record TurmaSocialResponseDTO(
        Long id,
        Long quadraId,
        String quadraNome,
        Long instrutorId,
        String instrutorNome,
        String modalidade,
        DiaSemana diaSemana,
        LocalTime horarioInicio,
        LocalTime horarioFim,
        Integer capacidadeAlunos,
        Boolean ativo
) {
    public static TurmaSocialResponseDTO fromEntity(TurmaSocial turma) {
        return new TurmaSocialResponseDTO(
                turma.getId(),
                turma.getQuadra().getId(),
                turma.getQuadra().getNome(),
                turma.getInstrutor().getId(),
                turma.getInstrutor().getNome(),
                turma.getModalidade(),
                turma.getDiaSemana(),
                turma.getHorarioInicio(),
                turma.getHorarioFim(),
                turma.getCapacidadeAlunos(),
                turma.getAtivo()
        );
    }
}
