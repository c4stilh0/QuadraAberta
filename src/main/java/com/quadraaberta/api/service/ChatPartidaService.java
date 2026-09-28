package com.quadraaberta.api.service;

import com.quadraaberta.api.dto.EnviarMensagemRequestDTO;
import com.quadraaberta.api.dto.MensagemPartidaResponseDTO;
import com.quadraaberta.api.entity.MensagemPartida;
import com.quadraaberta.api.entity.PartidaMatch;
import com.quadraaberta.api.entity.Usuario;
import com.quadraaberta.api.entity.enums.TipoMensagemPartida;
import com.quadraaberta.api.exception.EntidadeNaoEncontradaException;
import com.quadraaberta.api.exception.ValidacaoNegocioException;
import com.quadraaberta.api.repository.MensagemPartidaRepository;
import com.quadraaberta.api.repository.ParticipantePartidaRepository;
import com.quadraaberta.api.repository.PartidaMatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatPartidaService {

    private final MensagemPartidaRepository mensagemPartidaRepository;
    private final PartidaMatchRepository partidaMatchRepository;
    private final ParticipantePartidaRepository participanteRepository;

    @Transactional(readOnly = true)
    public List<MensagemPartidaResponseDTO> listarMensagens(Long partidaId, Long usuarioLogadoId) {
        PartidaMatch partida = buscarPartida(partidaId);
        Long criadorId = partida.getCriador() != null ? partida.getCriador().getId() : null;

        return mensagemPartidaRepository.findByPartidaIdComUsuarioOrderByCriadoEmAsc(partidaId)
                .stream()
                .map(m -> MensagemPartidaResponseDTO.fromEntity(m, usuarioLogadoId, criadorId))
                .toList();
    }

    @Transactional
    public MensagemPartidaResponseDTO enviarMensagem(Long partidaId, Usuario usuarioLogado, EnviarMensagemRequestDTO dto) {
        if (usuarioLogado == null) {
            throw new ValidacaoNegocioException("Você precisa estar autenticado para enviar mensagens no bate-papo.");
        }

        PartidaMatch partida = buscarPartida(partidaId);
        Long usuarioId = usuarioLogado.getId();
        Long criadorId = partida.getCriador() != null ? partida.getCriador().getId() : null;

        boolean isCriador = criadorId != null && criadorId.equals(usuarioId);
        boolean isParticipanteConfirmado = participanteRepository.existsByPartidaIdAndUsuarioId(partidaId, usuarioId);

        if (!isCriador && !isParticipanteConfirmado) {
            throw new ValidacaoNegocioException("Você precisa confirmar presença na partida para enviar mensagens no bate-papo.");
        }

        MensagemPartida novaMensagem = MensagemPartida.builder()
                .partida(partida)
                .usuario(usuarioLogado)
                .conteudo(dto.conteudo().trim())
                .tipo(TipoMensagemPartida.USUARIO)
                .criadoEm(LocalDateTime.now())
                .build();

        MensagemPartida salva = mensagemPartidaRepository.save(novaMensagem);
        log.info("Mensagem enviada na partida {} pelo usuário {}: {}", partidaId, usuarioId, salva.getId());

        return MensagemPartidaResponseDTO.fromEntity(salva, usuarioId, criadorId);
    }

    @Transactional
    public void enviarMensagemSistema(Long partidaId, String conteudo) {
        try {
            PartidaMatch partida = buscarPartida(partidaId);
            MensagemPartida aviso = MensagemPartida.builder()
                    .partida(partida)
                    .usuario(null)
                    .conteudo(conteudo)
                    .tipo(TipoMensagemPartida.SISTEMA)
                    .criadoEm(LocalDateTime.now())
                    .build();

            mensagemPartidaRepository.save(aviso);
            log.info("Mensagem de sistema registrada na partida {}: {}", partidaId, conteudo);
        } catch (Exception e) {
            log.warn("Falha ao registrar mensagem de sistema na partida {}: {}", partidaId, e.getMessage());
        }
    }

    private PartidaMatch buscarPartida(Long partidaId) {
        return partidaMatchRepository.findById(partidaId)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Partida não encontrada com ID: " + partidaId));
    }
}
