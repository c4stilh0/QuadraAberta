package com.quadraaberta.api.controller;

import com.quadraaberta.api.dto.EnviarMensagemRequestDTO;
import com.quadraaberta.api.dto.MensagemPartidaResponseDTO;
import com.quadraaberta.api.entity.Usuario;
import com.quadraaberta.api.service.ChatPartidaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/partidas/{partidaId}/mensagens")
@RequiredArgsConstructor
@Tag(name = "Chat da Partida", description = "Bate-papo em tempo real entre os atletas do lobby da partida esportiva")
public class ChatPartidaController {

    private final ChatPartidaService chatPartidaService;

    @GetMapping
    @Operation(summary = "Listar todas as mensagens e avisos de sistema do lobby da partida")
    public ResponseEntity<List<MensagemPartidaResponseDTO>> listarMensagens(
            @PathVariable Long partidaId,
            @AuthenticationPrincipal Usuario usuarioLogado
    ) {
        Long usuarioId = usuarioLogado != null ? usuarioLogado.getId() : null;
        List<MensagemPartidaResponseDTO> mensagens = chatPartidaService.listarMensagens(partidaId, usuarioId);
        return ResponseEntity.ok(mensagens);
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Enviar uma nova mensagem no bate-papo da partida (restrito ao criador e atletas confirmados)")
    public ResponseEntity<MensagemPartidaResponseDTO> enviarMensagem(
            @PathVariable Long partidaId,
            @AuthenticationPrincipal Usuario usuarioLogado,
            @RequestBody @Valid EnviarMensagemRequestDTO dto
    ) {
        MensagemPartidaResponseDTO criada = chatPartidaService.enviarMensagem(partidaId, usuarioLogado, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(criada);
    }
}
