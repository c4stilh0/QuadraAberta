package com.quadraaberta.api.service;

import com.quadraaberta.api.dto.ReservaRequestDTO;
import com.quadraaberta.api.dto.ReservaResponseDTO;
import com.quadraaberta.api.entity.Quadra;
import com.quadraaberta.api.entity.Reserva;
import com.quadraaberta.api.entity.TurmaSocial;
import com.quadraaberta.api.entity.Usuario;
import com.quadraaberta.api.entity.enums.*;
import com.quadraaberta.api.exception.ConflitoHorarioException;
import com.quadraaberta.api.exception.EntidadeNaoEncontradaException;
import com.quadraaberta.api.exception.LimiteReservasExcedidoException;
import com.quadraaberta.api.exception.ValidacaoNegocioException;
import com.quadraaberta.api.repository.QuadraRepository;
import com.quadraaberta.api.repository.ReservaRepository;
import com.quadraaberta.api.repository.TurmaSocialRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final QuadraRepository quadraRepository;
    private final TurmaSocialRepository turmaSocialRepository;

    private static final int LIMITE_MAXIMO_RESERVAS_FUTURAS = 2;
    private static final long LIMITE_DURACAO_MINUTOS = 120; // 2 horas consecutivas

    /**
     * Criação de reserva com controle estrito de concorrência e aplicação das 3 regras críticas de negócio.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ReservaResponseDTO criar(ReservaRequestDTO dto, Usuario usuario) {
        LocalDateTime agora = LocalDateTime.now();

        // Validação defensiva de datas
        if (dto.dataInicio() == null || dto.dataFim() == null) {
            throw new ValidacaoNegocioException("As datas de início e término são obrigatórias.");
        }

        if (!dto.dataFim().isAfter(dto.dataInicio())) {
            throw new ValidacaoNegocioException("A data/hora de término deve ser posterior à data/hora de início.");
        }

        if (dto.dataInicio().isBefore(agora)) {
            throw new ValidacaoNegocioException("Não é possível agendar uma reserva no passado.");
        }

        // =========================================================================
        // REGRA CRÍTICA 1: Teto de Duração Máxima (2 horas consecutivas para partidas avulsas)
        // =========================================================================
        long duracaoMinutos = Duration.between(dto.dataInicio(), dto.dataFim()).toMinutes();
        if (dto.tipoReserva() == TipoReserva.PARTIDA_AVULSA && duracaoMinutos > LIMITE_DURACAO_MINUTOS) {
            throw new ValidacaoNegocioException(
                    "Reservas de partidas avulsas não podem ultrapassar 2 horas consecutivas (120 minutos). " +
                    "Tempo solicitado: " + duracaoMinutos + " minutos."
            );
        }

        // =========================================================================
        // REGRA CRÍTICA 2: Antimonopólio Comunitário (Máximo de 2 reservas ativas futuras)
        // =========================================================================
        if (usuario.getRole() == Role.ROLE_COMUNIDADE) {
            long reservasAtivas = reservaRepository.countReservasFuturasAtivas(
                    usuario.getId(),
                    StatusReserva.CONFIRMADA,
                    agora
            );

            if (reservasAtivas >= LIMITE_MAXIMO_RESERVAS_FUTURAS) {
                throw new LimiteReservasExcedidoException(
                        "Limite de antimonopólio atingido: usuários da comunidade podem ter no máximo " +
                        LIMITE_MAXIMO_RESERVAS_FUTURAS + " agendamentos futuros ativos simultaneamente."
                );
            }
        }

        // =========================================================================
        // CONTROLE DE CONCORRÊNCIA: Lock Pessimista na Quadra
        // Serializa tentativas simultâneas de reserva para a mesma quadra
        // =========================================================================
        Quadra quadra = quadraRepository.findByIdWithLock(dto.quadraId())
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Quadra não encontrada com o ID: " + dto.quadraId()));

        if (quadra.getStatus() != StatusQuadra.DISPONIVEL) {
            throw new ValidacaoNegocioException(
                    "A quadra '" + quadra.getNome() + "' não está disponível para reservas (Status: " + quadra.getStatus() + ")."
            );
        }

        // =========================================================================
        // REGRA CRÍTICA 3: Prevenção de Double Booking (Sobreposição de Horários)
        // =========================================================================
        List<Reserva> reservasSobrepostas = reservaRepository.findSobreposicoes(
                quadra.getId(),
                dto.dataInicio(),
                dto.dataFim(),
                StatusReserva.CONFIRMADA
        );

        if (!reservasSobrepostas.isEmpty()) {
            Reserva conflito = reservasSobrepostas.get(0);
            throw new ConflitoHorarioException(
                    "A quadra já possui uma reserva confirmada para este horário: de " +
                    conflito.getDataInicio() + " até " + conflito.getDataFim() + "."
            );
        }

        // =========================================================================
        // REGRA DE PRIORIDADE SOCIAL: Conflito com Turmas Sociais Contínuas
        // =========================================================================
        if (dto.tipoReserva() == TipoReserva.PARTIDA_AVULSA) {
            DiaSemana diaSemana = converterParaDiaSemana(dto.dataInicio().getDayOfWeek());
            LocalTime inicioHora = dto.dataInicio().toLocalTime();
            LocalTime fimHora = dto.dataFim().toLocalTime();

            List<TurmaSocial> turmasConflitantes = turmaSocialRepository.findConflitosTurma(
                    quadra.getId(),
                    diaSemana,
                    inicioHora,
                    fimHora
            );

            if (!turmasConflitantes.isEmpty()) {
                TurmaSocial turma = turmasConflitantes.get(0);
                throw new ConflitoHorarioException(
                        "Horário bloqueado prioritariamente para a turma social contínua de '" +
                        turma.getModalidade() + "' (" + turma.getHorarioInicio() + " às " + turma.getHorarioFim() + ")."
                );
            }
        }

        // Criação e persistência da reserva confirmada
        Reserva novaReserva = Reserva.builder()
                .quadra(quadra)
                .usuario(usuario)
                .dataInicio(dto.dataInicio())
                .dataFim(dto.dataFim())
                .tipoReserva(dto.tipoReserva())
                .status(StatusReserva.CONFIRMADA)
                .criadoEm(agora)
                .build();

        Reserva salva = reservaRepository.save(novaReserva);
        log.info("Reserva #{} criada com sucesso para a quadra '{}' pelo usuário '{}'",
                salva.getId(), quadra.getNome(), usuario.getNome());

        return ReservaResponseDTO.fromEntity(salva);
    }

    @Transactional
    public void cancelar(Long reservaId, Usuario usuarioAutenticado) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Reserva não encontrada com ID: " + reservaId));

        boolean ehAutor = reserva.getUsuario().getId().equals(usuarioAutenticado.getId());
        boolean ehGestor = usuarioAutenticado.getRole() == Role.ROLE_GESTOR;

        if (!ehAutor && !ehGestor) {
            throw new AccessDeniedException("Você não tem permissão para cancelar esta reserva.");
        }

        if (reserva.getStatus() == StatusReserva.CANCELADA) {
            throw new ValidacaoNegocioException("Esta reserva já se encontra cancelada.");
        }

        reserva.setStatus(StatusReserva.CANCELADA);
        log.info("Reserva #{} cancelada pelo usuário '{}'", reservaId, usuarioAutenticado.getNome());
    }

    public List<ReservaResponseDTO> listarMinhasReservas(Long usuarioId) {
        return reservaRepository.findByUsuarioIdOrderByDataInicioDesc(usuarioId).stream()
                .map(ReservaResponseDTO::fromEntity)
                .toList();
    }

    public List<ReservaResponseDTO> listarPorQuadra(Long quadraId, LocalDateTime inicio, LocalDateTime fim) {
        return reservaRepository.findByQuadraIdAndStatusAndDataInicioBetween(
                quadraId,
                StatusReserva.CONFIRMADA,
                inicio != null ? inicio : LocalDateTime.now().minusDays(1),
                fim != null ? fim : LocalDateTime.now().plusMonths(1)
        ).stream().map(ReservaResponseDTO::fromEntity).toList();
    }

    private DiaSemana converterParaDiaSemana(DayOfWeek dayOfWeek) {
        return switch (dayOfWeek) {
            case MONDAY -> DiaSemana.SEGUNDA;
            case TUESDAY -> DiaSemana.TERCA;
            case WEDNESDAY -> DiaSemana.QUARTA;
            case THURSDAY -> DiaSemana.QUINTA;
            case FRIDAY -> DiaSemana.SEXTA;
            case SATURDAY -> DiaSemana.SABADO;
            case SUNDAY -> DiaSemana.DOMINGO;
        };
    }
}
