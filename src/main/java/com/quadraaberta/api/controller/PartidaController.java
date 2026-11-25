package com.quadraaberta.api.controller;

import com.quadraaberta.api.dto.*;
import com.quadraaberta.api.entity.Usuario;
import com.quadraaberta.api.service.MatchmakingService;
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
@RequestMapping("/api/partidas")
@RequiredArgsConstructor
@Tag(name = "Matchmaking e Partidas", description = "Endpoints para criação de jogos comunitários, confirmação de presença e sugestão inteligente de quadras mais próximas")
public class PartidaController {

    private final MatchmakingService matchmakingService;

    @GetMapping
    @Operation(summary = "Listar partidas ativas buscando jogadores ou com quadra definida")
    public ResponseEntity<List<PartidaResponseDTO>> listarPartidas(
            @RequestParam(value = "esporte", required = false) String esporte,
            @RequestParam(value = "status", required = false) com.quadraaberta.api.entity.enums.StatusPartida status,
            @AuthenticationPrincipal Usuario usuarioLogado
    ) {
        Long usuarioId = usuarioLogado != null ? usuarioLogado.getId() : null;
        List<PartidaResponseDTO> partidas = matchmakingService.listarPartidasAtivas(esporte, status, usuarioId);
        return ResponseEntity.ok(partidas);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obter detalhes de uma partida e as 3 quadras mais próximas sugeridas")
    public ResponseEntity<PartidaResponseDTO> buscarPorId(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuarioLogado
    ) {
        Long usuarioId = usuarioLogado != null ? usuarioLogado.getId() : null;
        PartidaResponseDTO partida = matchmakingService.buscarPorId(id, usuarioId);
        return ResponseEntity.ok(partida);
    }

    @GetMapping("/minhas")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Listar partidas que o usuário logado criou ou confirmou presença")
    public ResponseEntity<List<PartidaResponseDTO>> listarMinhasPartidas(@AuthenticationPrincipal Usuario usuarioLogado) {
        if (usuarioLogado == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<PartidaResponseDTO> partidas = matchmakingService.listarMinhasPartidas(usuarioLogado.getId());
        return ResponseEntity.ok(partidas);
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Criar novo lobby de partida esportiva e iniciar busca por jogadores")
    public ResponseEntity<PartidaResponseDTO> criarPartida(
            @AuthenticationPrincipal Usuario usuarioLogado,
            @RequestBody @Valid CriarPartidaRequestDTO dto
    ) {
        PartidaResponseDTO partida = matchmakingService.criarPartida(usuarioLogado, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(partida);
    }

    @PostMapping("/{id}/confirmar")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Confirmar presença na partida compartilhando localização para recálculo do centróide")
    public ResponseEntity<PartidaResponseDTO> confirmarPresenca(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuarioLogado,
            @RequestBody @Valid ConfirmarPresencaRequestDTO dto
    ) {
        PartidaResponseDTO partida = matchmakingService.confirmarPresenca(id, usuarioLogado, dto);
        return ResponseEntity.ok(partida);
    }

    @DeleteMapping("/{id}/sair")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Desistir da participação em uma partida")
    public ResponseEntity<PartidaResponseDTO> desistirPartida(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuarioLogado
    ) {
        PartidaResponseDTO partida = matchmakingService.desistirPartida(id, usuarioLogado);
        return ResponseEntity.ok(partida);
    }

    @PostMapping("/{id}/escolher-quadra")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Criador da partida escolhe e fixa uma das 3 quadras sugeridas pelo algoritmo")
    public ResponseEntity<PartidaResponseDTO> escolherQuadra(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuarioLogado,
            @RequestBody @Valid EscolherQuadraRequestDTO dto
    ) {
        PartidaResponseDTO partida = matchmakingService.escolherQuadra(id, dto.quadraId(), usuarioLogado);
        return ResponseEntity.ok(partida);
    }

    @PostMapping("/{id}/finalizar")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Finalizar uma partida encerrada para liberar avaliações dos colegas")
    public ResponseEntity<PartidaResponseDTO> finalizarPartida(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuarioLogado
    ) {
        PartidaResponseDTO partida = matchmakingService.finalizarPartida(id, usuarioLogado);
        return ResponseEntity.ok(partida);
    }

    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Cancelar uma partida criada")
    public ResponseEntity<Void> cancelarPartida(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuarioLogado
    ) {
        matchmakingService.cancelarPartida(id, usuarioLogado);
        return ResponseEntity.noContent().build();
    }
}
