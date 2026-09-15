package com.quadraaberta.api.service;

import com.quadraaberta.api.dto.AvaliacaoLoteRequestDTO;
import com.quadraaberta.api.dto.AvaliarColegaRequestDTO;
import com.quadraaberta.api.dto.ColegaAvaliacaoDTO;
import com.quadraaberta.api.dto.ReputacaoUsuarioDTO;
import com.quadraaberta.api.entity.AvaliacaoUsuario;
import com.quadraaberta.api.entity.PartidaMatch;
import com.quadraaberta.api.entity.ParticipantePartida;
import com.quadraaberta.api.entity.Usuario;
import com.quadraaberta.api.entity.enums.NivelHabilidade;
import com.quadraaberta.api.exception.EntidadeNaoEncontradaException;
import com.quadraaberta.api.exception.ValidacaoNegocioException;
import com.quadraaberta.api.repository.AvaliacaoUsuarioRepository;
import com.quadraaberta.api.repository.PartidaMatchRepository;
import com.quadraaberta.api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReputacaoService {

    private final AvaliacaoUsuarioRepository avaliacaoUsuarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final PartidaMatchRepository partidaRepository;

    public List<ColegaAvaliacaoDTO> listarColegasParaAvaliar(Long partidaId, Long avaliadorId) {
        PartidaMatch partida = partidaRepository.findById(partidaId)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Partida não encontrada com ID: " + partidaId));

        boolean avaliadorParticipou = partida.getParticipantes().stream()
                .anyMatch(p -> p.getUsuario().getId().equals(avaliadorId));

        if (!avaliadorParticipou) {
            throw new ValidacaoNegocioException("Você precisa ter participado da partida para avaliar os colegas.");
        }

        List<ColegaAvaliacaoDTO> colegas = new ArrayList<>();
        for (ParticipantePartida participante : partida.getParticipantes()) {
            Usuario colega = participante.getUsuario();
            if (colega.getId().equals(avaliadorId)) {
                continue; // Não lista a si mesmo
            }

            boolean jaAvaliado = avaliacaoUsuarioRepository
                    .existsByPartidaIdAndAvaliadorIdAndAvaliadoId(partidaId, avaliadorId, colega.getId());

            String habDescricao = colega.getHabilidadeDeclarada() != null
                    ? colega.getHabilidadeDeclarada().getDescricao()
                    : "Jogador Casual";

            colegas.add(new ColegaAvaliacaoDTO(
                    colega.getId(),
                    colega.getNome(),
                    colega.getFotoUrl(),
                    participante.getBairro(),
                    colega.getReputacao() != null ? colega.getReputacao() : 5.0,
                    habDescricao,
                    jaAvaliado
            ));
        }

        return colegas;
    }

    @Transactional
    public void registrarAvaliacoesEmLote(Long partidaId, Long avaliadorId, AvaliacaoLoteRequestDTO lote) {
        PartidaMatch partida = partidaRepository.findById(partidaId)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Partida não encontrada com ID: " + partidaId));

        Usuario avaliador = usuarioRepository.findById(avaliadorId)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Usuário avaliador não encontrado com ID: " + avaliadorId));

        boolean avaliadorParticipou = partida.getParticipantes().stream()
                .anyMatch(p -> p.getUsuario().getId().equals(avaliadorId));

        if (!avaliadorParticipou) {
            throw new ValidacaoNegocioException("Você não participou desta partida para avaliar outros participantes.");
        }

        for (AvaliarColegaRequestDTO req : lote.avaliacoes()) {
            if (req.avaliadoId().equals(avaliadorId)) {
                throw new ValidacaoNegocioException("Você não pode se autoavaliar.");
            }

            boolean avaliadoParticipou = partida.getParticipantes().stream()
                    .anyMatch(p -> p.getUsuario().getId().equals(req.avaliadoId()));

            if (!avaliadoParticipou) {
                throw new ValidacaoNegocioException("O usuário avaliado não participou desta partida.");
            }

            if (avaliacaoUsuarioRepository.existsByPartidaIdAndAvaliadorIdAndAvaliadoId(partidaId, avaliadorId, req.avaliadoId())) {
                log.info("Usuário {} já avaliou {} na partida {}. Ignorando duplicata.", avaliadorId, req.avaliadoId(), partidaId);
                continue;
            }

            Usuario avaliado = usuarioRepository.findById(req.avaliadoId())
                    .orElseThrow(() -> new EntidadeNaoEncontradaException("Usuário a ser avaliado não encontrado: " + req.avaliadoId()));

            // 1. Processa Reputação com Amortecimento Dinâmico (Momentum Damping)
            processarReputacaoComAmortecimento(avaliado, req.notaReputacao());

            // 2. Processa Validação de Habilidade pelos Colegas
            if (req.nivelHabilidade() != null) {
                processarValidacaoHabilidade(avaliado, req.nivelHabilidade());
            }

            // 3. Salva Registro Anônimo da Avaliação
            AvaliacaoUsuario avaliacao = AvaliacaoUsuario.builder()
                    .partida(partida)
                    .avaliador(avaliador)
                    .avaliado(avaliado)
                    .notaReputacao(req.notaReputacao())
                    .nivelHabilidade(req.nivelHabilidade())
                    .comentario(req.comentario() != null ? req.comentario().trim() : null)
                    .criadoEm(LocalDateTime.now())
                    .build();

            avaliacaoUsuarioRepository.save(avaliacao);
            usuarioRepository.save(avaliado);

            log.info("Avaliação registrada para usuário {} (Nova Reputação: {}, Validação Habilidade: {})",
                    avaliado.getId(), avaliado.getReputacao(), avaliado.getHabilidadeValidada());
        }
    }

    private void processarReputacaoComAmortecimento(Usuario avaliado, int nota) {
        double reputacaoAtual = avaliado.getReputacao() != null ? avaliado.getReputacao() : 5.0;
        int totalAvaliacoes = avaliado.getTotalAvaliacoesReputacao() != null ? avaliado.getTotalAvaliacoesReputacao() : 0;
        int streakPos = avaliado.getStreakPositiva() != null ? avaliado.getStreakPositiva() : 0;
        int streakNeg = avaliado.getStreakNegativa() != null ? avaliado.getStreakNegativa() : 0;

        double peso;

        if (nota >= 4) { // Avaliação Positiva
            if (streakNeg > 0) {
                // Usuário vinha de streak negativa: avaliação positiva sofre amortecimento
                peso = 1.0 / (1.0 + 0.25 * streakNeg);
                streakNeg = Math.max(0, streakNeg - 1);
            } else {
                peso = 1.0;
                streakPos = Math.min(20, streakPos + 1);
            }
        } else if (nota <= 2) { // Avaliação Negativa
            if (streakPos > 0) {
                // Usuário vinha de streak positiva: avaliação negativa sofre amortecimento
                peso = 1.0 / (1.0 + 0.25 * streakPos);
                streakPos = Math.max(0, streakPos - 1);
            } else {
                peso = 1.0;
                streakNeg = Math.min(20, streakNeg + 1);
            }
        } else { // Nota Neutra (3)
            peso = 1.0;
            // Streaks mantidas
        }

        // Peso acumulado histórico (âncora inicial de 1.0 correspondendo aos 5.0 iniciais)
        double pesoHistorico = Math.max(1.0, (double) totalAvaliacoes);
        double novaReputacao = ((reputacaoAtual * pesoHistorico) + (nota * peso)) / (pesoHistorico + peso);

        // Clamping estrito entre 1.0 e 5.0 com 2 casas decimais
        novaReputacao = Math.max(1.0, Math.min(5.0, Math.round(novaReputacao * 100.0) / 100.0));

        avaliado.setReputacao(novaReputacao);
        avaliado.setTotalAvaliacoesReputacao(totalAvaliacoes + 1);
        avaliado.setStreakPositiva(streakPos);
        avaliado.setStreakNegativa(streakNeg);
    }

    private void processarValidacaoHabilidade(Usuario avaliado, NivelHabilidade nivelInformado) {
        double pesoNivel = nivelInformado.getPeso();
        int totalAvaliacoes = avaliado.getTotalAvaliacoesHabilidade() != null ? avaliado.getTotalAvaliacoesHabilidade() : 0;
        Double mediaAtual = avaliado.getHabilidadeValidada();

        double novaMedia;
        if (mediaAtual == null || totalAvaliacoes == 0) {
            novaMedia = pesoNivel;
        } else {
            novaMedia = ((mediaAtual * totalAvaliacoes) + pesoNivel) / (totalAvaliacoes + 1);
        }

        novaMedia = Math.round(novaMedia * 100.0) / 100.0;

        avaliado.setHabilidadeValidada(novaMedia);
        avaliado.setTotalAvaliacoesHabilidade(totalAvaliacoes + 1);
    }

    public ReputacaoUsuarioDTO obterReputacaoUsuario(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Usuário não encontrado com ID: " + usuarioId));

        return ReputacaoUsuarioDTO.fromEntity(usuario);
    }
}
