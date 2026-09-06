package com.quadraaberta.api.service;

import com.quadraaberta.api.dto.TurmaSocialRequestDTO;
import com.quadraaberta.api.dto.TurmaSocialResponseDTO;
import com.quadraaberta.api.entity.Quadra;
import com.quadraaberta.api.entity.TurmaSocial;
import com.quadraaberta.api.entity.Usuario;
import com.quadraaberta.api.entity.enums.Role;
import com.quadraaberta.api.entity.enums.StatusQuadra;
import com.quadraaberta.api.exception.ConflitoHorarioException;
import com.quadraaberta.api.exception.EntidadeNaoEncontradaException;
import com.quadraaberta.api.exception.ValidacaoNegocioException;
import com.quadraaberta.api.repository.QuadraRepository;
import com.quadraaberta.api.repository.TurmaSocialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TurmaSocialService {

    private final TurmaSocialRepository turmaSocialRepository;
    private final QuadraRepository quadraRepository;

    @Transactional
    public TurmaSocialResponseDTO criar(TurmaSocialRequestDTO dto, Usuario instrutor) {
        if (instrutor.getRole() != Role.ROLE_VOLUNTARIO && instrutor.getRole() != Role.ROLE_GESTOR) {
            throw new ValidacaoNegocioException("Apenas voluntários ou gestores podem cadastrar turmas sociais contínuas.");
        }

        if (!dto.horarioFim().isAfter(dto.horarioInicio())) {
            throw new ValidacaoNegocioException("O horário de término deve ser posterior ao horário de início da aula.");
        }

        Quadra quadra = quadraRepository.findById(dto.quadraId())
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Quadra não encontrada com ID: " + dto.quadraId()));

        if (quadra.getStatus() != StatusQuadra.DISPONIVEL) {
            throw new ValidacaoNegocioException("A quadra selecionada não está disponível (Status atual: " + quadra.getStatus() + ").");
        }

        List<TurmaSocial> conflitos = turmaSocialRepository.findConflitosTurma(
                quadra.getId(),
                dto.diaSemana(),
                dto.horarioInicio(),
                dto.horarioFim()
        );

        if (!conflitos.isEmpty()) {
            TurmaSocial existente = conflitos.get(0);
            throw new ConflitoHorarioException(
                    "Já existe uma turma social de '" + existente.getModalidade() +
                    "' cadastrada para " + dto.diaSemana() + " entre " +
                    existente.getHorarioInicio() + " e " + existente.getHorarioFim() + "."
            );
        }

        TurmaSocial turma = TurmaSocial.builder()
                .quadra(quadra)
                .instrutor(instrutor)
                .modalidade(dto.modalidade().trim())
                .diaSemana(dto.diaSemana())
                .horarioInicio(dto.horarioInicio())
                .horarioFim(dto.horarioFim())
                .capacidadeAlunos(dto.capacidadeAlunos())
                .ativo(true)
                .build();

        TurmaSocial salva = turmaSocialRepository.save(turma);
        return TurmaSocialResponseDTO.fromEntity(salva);
    }

    public List<TurmaSocialResponseDTO> listarPorQuadra(Long quadraId) {
        return turmaSocialRepository.findByQuadraIdAndAtivoTrue(quadraId).stream()
                .map(TurmaSocialResponseDTO::fromEntity)
                .toList();
    }

    public List<TurmaSocialResponseDTO> listarTodas() {
        return turmaSocialRepository.findAll().stream()
                .map(TurmaSocialResponseDTO::fromEntity)
                .toList();
    }
}
