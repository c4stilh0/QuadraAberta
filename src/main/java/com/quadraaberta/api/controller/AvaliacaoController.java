package com.quadraaberta.api.controller;

import com.quadraaberta.api.dto.AvaliacaoLoteRequestDTO;
import com.quadraaberta.api.dto.ColegaAvaliacaoDTO;
import com.quadraaberta.api.dto.ReputacaoUsuarioDTO;
import com.quadraaberta.api.entity.Usuario;
import com.quadraaberta.api.service.ReputacaoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/avaliacoes")
@RequiredArgsConstructor
@Tag(name = "Avaliações e Reputação", description = "Endpoints para avaliação anônima entre participantes, cálculo de reputação estilo Uber e validação de habilidade por pares")
@SecurityRequirement(name = "bearerAuth")
public class AvaliacaoController {

    private final ReputacaoService reputacaoService;

    @GetMapping("/partida/{partidaId}/colegas")
    @Operation(summary = "Listar colegas de uma partida disponíveis para avaliação",
               description = "Retorna lista dos outros jogadores da partida com status indicando se o usuário logado já os avaliou.")
    public ResponseEntity<List<ColegaAvaliacaoDTO>> listarColegasParaAvaliar(
            @PathVariable Long partidaId,
            @AuthenticationPrincipal Usuario usuarioLogado
    ) {
        List<ColegaAvaliacaoDTO> colegas = reputacaoService.listarColegasParaAvaliar(partidaId, usuarioLogado.getId());
        return ResponseEntity.ok(colegas);
    }

    @PostMapping("/partida/{partidaId}")
    @Operation(summary = "Enviar avaliações anônimas para os colegas de partida",
               description = "Processa reputação (algoritmo de amortecimento dinâmico estilo Uber) e validação da habilidade declarada pelos pares.")
    public ResponseEntity<Void> registrarAvaliacoes(
            @PathVariable Long partidaId,
            @AuthenticationPrincipal Usuario usuarioLogado,
            @RequestBody @Valid AvaliacaoLoteRequestDTO lote
    ) {
        reputacaoService.registrarAvaliacoesEmLote(partidaId, usuarioLogado.getId(), lote);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/usuario/{usuarioId}")
    @Operation(summary = "Consultar reputação e habilidade de um usuário específico")
    public ResponseEntity<ReputacaoUsuarioDTO> obterReputacaoUsuario(@PathVariable Long usuarioId) {
        ReputacaoUsuarioDTO reputacao = reputacaoService.obterReputacaoUsuario(usuarioId);
        return ResponseEntity.ok(reputacao);
    }
}
