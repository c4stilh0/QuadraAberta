package com.quadraaberta.api.service;

import com.quadraaberta.api.dto.*;
import com.quadraaberta.api.entity.PartidaMatch;
import com.quadraaberta.api.entity.ParticipantePartida;
import com.quadraaberta.api.entity.Quadra;
import com.quadraaberta.api.entity.Reserva;
import com.quadraaberta.api.entity.TurmaSocial;
import com.quadraaberta.api.entity.Usuario;
import com.quadraaberta.api.entity.enums.DiaSemana;
import com.quadraaberta.api.entity.enums.Role;
import com.quadraaberta.api.entity.enums.StatusPartida;
import com.quadraaberta.api.entity.enums.StatusQuadra;
import com.quadraaberta.api.entity.enums.StatusReserva;
import com.quadraaberta.api.exception.ConflitoHorarioException;
import com.quadraaberta.api.exception.EntidadeNaoEncontradaException;
import com.quadraaberta.api.exception.ValidacaoNegocioException;
import com.quadraaberta.api.repository.PartidaMatchRepository;
import com.quadraaberta.api.repository.QuadraRepository;
import com.quadraaberta.api.repository.ReservaRepository;
import com.quadraaberta.api.repository.TurmaSocialRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchmakingService {

    private final PartidaMatchRepository partidaRepository;
    private final QuadraRepository quadraRepository;
    private final ReservaRepository reservaRepository;
    private final TurmaSocialRepository turmaSocialRepository;
    private final ChatPartidaService chatPartidaService;

    @Transactional
    public PartidaResponseDTO criarPartida(Usuario criador, CriarPartidaRequestDTO dto) {
        if (dto.minJogadores() > dto.maxJogadores()) {
            throw new ValidacaoNegocioException("O número mínimo de jogadores não pode ser maior que o máximo.");
        }

        PartidaMatch partida = PartidaMatch.builder()
                .criador(criador)
                .esporte(dto.esporte().trim())
                .dataHora(dto.dataHora())
                .duracaoMinutos(dto.duracaoMinutos() != null ? dto.duracaoMinutos() : 60)
                .minJogadores(dto.minJogadores())
                .maxJogadores(dto.maxJogadores())
                .descricao(dto.descricao())
                .bairroCriador(dto.bairro().trim())
                .status(StatusPartida.BUSCANDO_JOGADORES)
                .centroideLat(dto.latitude())
                .centroideLng(dto.longitude())
                .criadoEm(LocalDateTime.now())
                .build();

        // O criador é automaticamente o primeiro participante da partida
        ParticipantePartida participanteCriador = ParticipantePartida.builder()
                .partida(partida)
                .usuario(criador)
                .latitude(dto.latitude())
                .longitude(dto.longitude())
                .bairro(dto.bairro().trim())
                .confirmadoEm(LocalDateTime.now())
                .build();

        partida.getParticipantes().add(participanteCriador);
        PartidaMatch salva = partidaRepository.save(partida);

        log.info("Nova partida de {} criada pelo usuário '{}' em {}",
                salva.getEsporte(), criador.getNome(), salva.getBairroCriador());

        chatPartidaService.enviarMensagemSistema(salva.getId(), "Partida criada por " + criador.getNome() + "! Aguardando quórum.");

        List<QuadraSugeridaDTO> top3 = calcularTop3QuadrasSugeridas(salva);
        return PartidaResponseDTO.fromEntity(salva, top3, criador.getId());
    }

    @Transactional
    public PartidaResponseDTO confirmarPresenca(Long partidaId, Usuario usuario, ConfirmarPresencaRequestDTO dto) {
        PartidaMatch partida = buscarEntidadePorId(partidaId);

        if (partida.getStatus() == StatusPartida.CANCELADA || partida.getStatus() == StatusPartida.FINALIZADA) {
            throw new ValidacaoNegocioException("Esta partida não está mais aberta para confirmação.");
        }

        boolean jaInscrito = partida.getParticipantes().stream()
                .anyMatch(p -> p.getUsuario().getId().equals(usuario.getId()));
        if (jaInscrito) {
            throw new ValidacaoNegocioException("Você já confirmou presença nesta partida.");
        }

        if (partida.getParticipantes().size() >= partida.getMaxJogadores()) {
            throw new ValidacaoNegocioException("Esta partida já atingiu o limite máximo de jogadores.");
        }

        ParticipantePartida novoParticipante = ParticipantePartida.builder()
                .partida(partida)
                .usuario(usuario)
                .latitude(dto.latitude())
                .longitude(dto.longitude())
                .bairro(dto.bairro().trim())
                .confirmadoEm(LocalDateTime.now())
                .build();

        partida.getParticipantes().add(novoParticipante);

        // Recalcula o centróide com as coordenadas de todos os confirmados
        recalcularCentroide(partida);

        PartidaMatch atualizada = partidaRepository.save(partida);
        log.info("Usuário '{}' confirmou presença na partida #{} ({})",
                usuario.getNome(), partida.getId(), partida.getEsporte());

        chatPartidaService.enviarMensagemSistema(partida.getId(), usuario.getNome() + " confirmou presença!");

        List<QuadraSugeridaDTO> top3 = calcularTop3QuadrasSugeridas(atualizada);
        return PartidaResponseDTO.fromEntity(atualizada, top3, usuario.getId());
    }

    @Transactional
    public PartidaResponseDTO desistirPartida(Long partidaId, Usuario usuario) {
        PartidaMatch partida = buscarEntidadePorId(partidaId);

        if (partida.getCriador().getId().equals(usuario.getId()) && partida.getParticipantes().size() <= 1) {
            partida.setStatus(StatusPartida.CANCELADA);
            PartidaMatch cancelada = partidaRepository.save(partida);
            chatPartidaService.enviarMensagemSistema(partidaId, "Partida cancelada pelo criador.");
            return PartidaResponseDTO.fromEntity(cancelada, List.of(), usuario.getId());
        }

        boolean removido = partida.getParticipantes().removeIf(p -> p.getUsuario().getId().equals(usuario.getId()));
        if (!removido) {
            throw new ValidacaoNegocioException("Você não está participando desta partida.");
        }

        recalcularCentroide(partida);
        PartidaMatch atualizada = partidaRepository.save(partida);

        chatPartidaService.enviarMensagemSistema(partidaId, usuario.getNome() + " saiu da partida.");

        List<QuadraSugeridaDTO> top3 = calcularTop3QuadrasSugeridas(atualizada);
        return PartidaResponseDTO.fromEntity(atualizada, top3, usuario.getId());
    }

    @Transactional
    public PartidaResponseDTO escolherQuadra(Long partidaId, Long quadraId, Usuario usuario) {
        PartidaMatch partida = buscarEntidadePorId(partidaId);

        if (partida.getStatus() == StatusPartida.CANCELADA || partida.getStatus() == StatusPartida.FINALIZADA) {
            throw new ValidacaoNegocioException("Não é possível alterar a quadra de uma partida encerrada ou cancelada.");
        }

        if (!partida.getCriador().getId().equals(usuario.getId())) {
            throw new ValidacaoNegocioException("Apenas o criador da partida tem permissão para escolher e fixar a quadra.");
        }

        Quadra quadra = quadraRepository.findById(quadraId)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Quadra não encontrada com ID: " + quadraId));

        if (quadra.getStatus() != StatusQuadra.DISPONIVEL) {
            throw new ValidacaoNegocioException("Esta quadra não está disponível no momento (Status: " + quadra.getStatus() + ").");
        }

        validarConflitoHorarioQuadra(partida, quadra);

        partida.setQuadraEscolhida(quadra);
        partida.setStatus(StatusPartida.QUADRA_DEFINIDA);

        PartidaMatch atualizada = partidaRepository.save(partida);
        log.info("Criador '{}' escolheu a quadra '{}' para a partida #{}",
                usuario.getNome(), quadra.getNome(), partida.getId());

        chatPartidaService.enviarMensagemSistema(partidaId, "Local oficial fixado: " + quadra.getNome() + "!");

        List<QuadraSugeridaDTO> top3 = calcularTop3QuadrasSugeridas(atualizada);
        return PartidaResponseDTO.fromEntity(atualizada, top3, usuario.getId());
    }

    private void validarConflitoHorarioQuadra(PartidaMatch partida, Quadra quadra) {
        LocalDateTime inicio = partida.getDataHora();
        int duracao = partida.getDuracaoMinutos() != null ? partida.getDuracaoMinutos() : 60;
        LocalDateTime fim = inicio.plusMinutes(duracao);

        List<Reserva> reservasConflitantes = reservaRepository.findSobreposicoes(
                quadra.getId(), inicio, fim, StatusReserva.CONFIRMADA
        );
        if (!reservasConflitantes.isEmpty()) {
            Reserva r = reservasConflitantes.get(0);
            throw new ConflitoHorarioException(
                    "A quadra '" + quadra.getNome() + "' já possui reserva confirmada entre " +
                    r.getDataInicio() + " e " + r.getDataFim() + "."
            );
        }

        DiaSemana diaSemana = DiaSemana.fromDayOfWeek(inicio.getDayOfWeek());
        LocalTime horaInicio = inicio.toLocalTime();
        LocalTime horaFim = fim.toLocalTime();
        List<TurmaSocial> turmasConflitantes = turmaSocialRepository.findConflitosTurma(
                quadra.getId(), diaSemana, horaInicio, horaFim
        );
        if (!turmasConflitantes.isEmpty()) {
            TurmaSocial t = turmasConflitantes.get(0);
            throw new ConflitoHorarioException(
                    "Horário bloqueado prioritariamente para a turma social de '" +
                    t.getModalidade() + "' (" + t.getHorarioInicio() + " às " + t.getHorarioFim() + ")."
            );
        }

        List<PartidaMatch> candidatas = partidaRepository.findPartidasFixadasNaQuadraNoPeriodo(
                quadra.getId(),
                StatusPartida.QUADRA_DEFINIDA,
                partida.getId(),
                inicio.minusHours(4),
                fim.plusHours(4)
        );
        for (PartidaMatch outra : candidatas) {
            LocalDateTime outraInicio = outra.getDataHora();
            int outraDuracao = outra.getDuracaoMinutos() != null ? outra.getDuracaoMinutos() : 60;
            LocalDateTime outraFim = outraInicio.plusMinutes(outraDuracao);
            if (outraInicio.isBefore(fim) && outraFim.isAfter(inicio)) {
                throw new ConflitoHorarioException(
                        "A quadra '" + quadra.getNome() + "' já está fixada para outra partida comunitária neste horário."
                );
            }
        }
    }

    @Transactional(readOnly = true)
    public List<PartidaResponseDTO> listarPartidasAtivas(String esporteFiltro, Long usuarioAutenticadoId) {
        return listarPartidasAtivas(esporteFiltro, null, usuarioAutenticadoId);
    }

    @Transactional(readOnly = true)
    public List<PartidaResponseDTO> listarPartidasAtivas(String esporteFiltro, StatusPartida statusFiltro, Long usuarioAutenticadoId) {
        LocalDateTime limite = LocalDateTime.now().minusHours(3);
        List<StatusPartida> statusAtivos = (statusFiltro != null && statusFiltro != StatusPartida.CANCELADA)
                ? List.of(statusFiltro)
                : List.of(StatusPartida.BUSCANDO_JOGADORES, StatusPartida.QUADRA_DEFINIDA);

        List<PartidaMatch> partidas = partidaRepository.buscarPartidasAtivas(statusAtivos, limite);
        List<Quadra> quadrasElegiveis = carregarQuadrasElegiveis();

        return partidas.stream()
                .filter(p -> {
                    if (esporteFiltro == null || esporteFiltro.isBlank() || esporteFiltro.equalsIgnoreCase("Todos")) {
                        return true;
                    }
                    return p.getEsporte().equalsIgnoreCase(esporteFiltro.trim());
                })
                .map(p -> {
                    List<QuadraSugeridaDTO> top3 = calcularTop3QuadrasSugeridas(p, quadrasElegiveis);
                    return PartidaResponseDTO.fromEntity(p, top3, usuarioAutenticadoId);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public PartidaResponseDTO buscarPorId(Long partidaId, Long usuarioAutenticadoId) {
        PartidaMatch partida = buscarEntidadePorId(partidaId);
        List<QuadraSugeridaDTO> top3 = calcularTop3QuadrasSugeridas(partida);
        return PartidaResponseDTO.fromEntity(partida, top3, usuarioAutenticadoId);
    }

    @Transactional(readOnly = true)
    public List<PartidaResponseDTO> listarMinhasPartidas(Long usuarioId) {
        List<StatusPartida> statusVisiveis = List.of(
                StatusPartida.BUSCANDO_JOGADORES,
                StatusPartida.QUADRA_DEFINIDA,
                StatusPartida.FINALIZADA
        );
        List<PartidaMatch> minhas = partidaRepository.findMinhasPartidas(usuarioId, statusVisiveis);
        List<Quadra> quadrasElegiveis = carregarQuadrasElegiveis();
        return minhas.stream()
                .map(p -> {
                    List<QuadraSugeridaDTO> top3 = calcularTop3QuadrasSugeridas(p, quadrasElegiveis);
                    return PartidaResponseDTO.fromEntity(p, top3, usuarioId);
                })
                .toList();
    }

    @Transactional
    public PartidaResponseDTO finalizarPartida(Long partidaId, Usuario usuario) {
        PartidaMatch partida = buscarEntidadePorId(partidaId);
        boolean ehCriador = partida.getCriador().getId().equals(usuario.getId());
        boolean ehGestor = usuario.getRole() == Role.ROLE_GESTOR;
        if (!ehCriador && !ehGestor) {
            throw new ValidacaoNegocioException("Apenas o organizador ou um gestor pode finalizar esta partida.");
        }
        if (partida.getStatus() == StatusPartida.CANCELADA) {
            throw new ValidacaoNegocioException("Não é possível finalizar uma partida cancelada.");
        }
        if (partida.getStatus() == StatusPartida.FINALIZADA) {
            throw new ValidacaoNegocioException("Esta partida já foi finalizada.");
        }

        partida.setStatus(StatusPartida.FINALIZADA);
        PartidaMatch salva = partidaRepository.save(partida);
        chatPartidaService.enviarMensagemSistema(partidaId, "Partida finalizada! Já é possível avaliar os colegas participantes.");
        log.info("Partida #{} finalizada pelo usuário '{}'", partidaId, usuario.getNome());

        List<QuadraSugeridaDTO> top3 = calcularTop3QuadrasSugeridas(salva);
        return PartidaResponseDTO.fromEntity(salva, top3, usuario.getId());
    }

    @Transactional
    public void cancelarPartida(Long partidaId, Usuario usuario) {
        PartidaMatch partida = buscarEntidadePorId(partidaId);
        if (!partida.getCriador().getId().equals(usuario.getId()) && usuario.getRole() != Role.ROLE_GESTOR) {
            throw new ValidacaoNegocioException("Você não tem permissão para cancelar esta partida.");
        }
        partida.setStatus(StatusPartida.CANCELADA);
        partidaRepository.save(partida);
        chatPartidaService.enviarMensagemSistema(partidaId, "Partida cancelada pelo organizador.");
        log.info("Partida #{} cancelada pelo usuário '{}'", partidaId, usuario.getNome());
    }

    private List<Quadra> carregarQuadrasElegiveis() {
        return quadraRepository.findAll().stream()
                .filter(q -> q.getStatus() != StatusQuadra.INTERDITADA)
                .filter(q -> q.getLatitude() != null && q.getLongitude() != null)
                .toList();
    }

    /**
     * ALGORITMO DO CENTRÓIDE & TOP 3 QUADRAS MAIS PRÓXIMAS:
     * Calcula o centro de gravidade geográfico e ranqueia as quadras
     * compatíveis com a modalidade pela menor distância média coletiva.
     */
    public List<QuadraSugeridaDTO> calcularTop3QuadrasSugeridas(PartidaMatch partida) {
        return calcularTop3QuadrasSugeridas(partida, carregarQuadrasElegiveis());
    }

    private List<QuadraSugeridaDTO> calcularTop3QuadrasSugeridas(PartidaMatch partida, List<Quadra> todasQuadras) {
        List<ParticipantePartida> participantes = partida.getParticipantes();
        if (participantes == null || participantes.isEmpty() || todasQuadras == null || todasQuadras.isEmpty()) {
            return List.of();
        }

        // 2. Filtra por compatibilidade com a modalidade esportiva (se houver quadras compatíveis)
        String esporteNorm = normalizarTexto(partida.getEsporte());
        List<Quadra> quadrasCompativeis = todasQuadras.stream()
                .filter(q -> {
                    if (q.getModalidades() == null) return false;
                    String modsNorm = normalizarTexto(q.getModalidades());
                    return modsNorm.contains(esporteNorm) || modsNorm.contains("poliesportiva");
                })
                .toList();

        // Se nenhuma tiver a tag específica, usa todas as quadras poliesportivas da cidade
        List<Quadra> poolQuadras = quadrasCompativeis.isEmpty() ? todasQuadras : quadrasCompativeis;

        // 3. Para cada quadra candidata, calcula a distância média de todos os participantes
        record QuadraPontuada(Quadra quadra, double distanciaMedia) {}

        List<QuadraPontuada> ranking = new ArrayList<>();

        for (Quadra q : poolQuadras) {
            double qLat = q.getLatitude().doubleValue();
            double qLng = q.getLongitude().doubleValue();

            double somaDistancias = 0.0;
            for (ParticipantePartida p : participantes) {
                somaDistancias += haversine(p.getLatitude(), p.getLongitude(), qLat, qLng);
            }

            double distanciaMedia = somaDistancias / participantes.size();
            ranking.add(new QuadraPontuada(q, distanciaMedia));
        }

        // 4. Ordena do mais próximo para o mais distante e pega os 3 melhores
        ranking.sort((a, b) -> Double.compare(a.distanciaMedia(), b.distanciaMedia()));

        return ranking.stream()
                .limit(3)
                .map(item -> QuadraSugeridaDTO.fromQuadraEDistancia(item.quadra(), item.distanciaMedia()))
                .toList();
    }

    private void recalcularCentroide(PartidaMatch partida) {
        List<ParticipantePartida> parts = partida.getParticipantes();
        if (parts == null || parts.isEmpty()) {
            partida.setCentroideLat(null);
            partida.setCentroideLng(null);
            return;
        }

        double somaLat = 0.0;
        double somaLng = 0.0;
        for (ParticipantePartida p : parts) {
            somaLat += p.getLatitude();
            somaLng += p.getLongitude();
        }

        partida.setCentroideLat(somaLat / parts.size());
        partida.setCentroideLng(somaLng / parts.size());
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Raio da Terra em km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private String normalizarTexto(String s) {
        if (s == null) return "";
        return java.text.Normalizer.normalize(s.toLowerCase(), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
    }

    private PartidaMatch buscarEntidadePorId(Long id) {
        return partidaRepository.findById(id)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Partida não encontrada com ID: " + id));
    }
}
