package com.quadraaberta.api.controller;

import com.quadraaberta.api.dto.AtualizarStatusChamadoDTO;
import com.quadraaberta.api.dto.ChamadoZeladoriaRequestDTO;
import com.quadraaberta.api.dto.ChamadoZeladoriaResponseDTO;
import com.quadraaberta.api.entity.Usuario;
import com.quadraaberta.api.entity.enums.CategoriaChamado;
import com.quadraaberta.api.service.ChamadoZeladoriaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/chamados")
@RequiredArgsConstructor
@Tag(name = "Zeladoria Participativa", description = "Canal comunitário para abertura e acompanhamento de chamados de manutenção com fotos")
public class ChamadoZeladoriaController {

    private final ChamadoZeladoriaService chamadoService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
            summary = "Abrir chamado de zeladoria com envio opcional de foto",
            description = "Permite que moradores reportem iluminação queimada, alambrado quebrado, etc. A foto é enviada ao Cloudinary."
    )
    public ResponseEntity<ChamadoZeladoriaResponseDTO> criar(
            @RequestParam("quadraId") Long quadraId,
            @RequestParam("categoria") CategoriaChamado categoria,
            @RequestParam("descricao") String descricao,
            @Parameter(description = "Foto comprobatória (JPEG/PNG/WEBP)", content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE))
            @RequestParam(value = "foto", required = false) MultipartFile foto,
            @AuthenticationPrincipal Usuario autor
    ) {
        ChamadoZeladoriaRequestDTO dto = new ChamadoZeladoriaRequestDTO(quadraId, categoria, descricao);
        ChamadoZeladoriaResponseDTO response = chamadoService.criar(dto, foto, autor);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "Listar todos os chamados de zeladoria")
    public ResponseEntity<List<ChamadoZeladoriaResponseDTO>> listarTodos() {
        List<ChamadoZeladoriaResponseDTO> chamados = chamadoService.listarTodos();
        return ResponseEntity.ok(chamados);
    }

    @GetMapping("/quadra/{quadraId}")
    @Operation(summary = "Listar chamados de uma quadra específica")
    public ResponseEntity<List<ChamadoZeladoriaResponseDTO>> listarPorQuadra(@PathVariable Long quadraId) {
        List<ChamadoZeladoriaResponseDTO> chamados = chamadoService.listarPorQuadra(quadraId);
        return ResponseEntity.ok(chamados);
    }

    @GetMapping("/meus")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Listar chamados abertos pelo usuário autenticado")
    public ResponseEntity<List<ChamadoZeladoriaResponseDTO>> listarMeus(@AuthenticationPrincipal Usuario autor) {
        List<ChamadoZeladoriaResponseDTO> chamados = chamadoService.listarPorAutor(autor.getId());
        return ResponseEntity.ok(chamados);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar detalhes de um chamado de manutenção")
    public ResponseEntity<ChamadoZeladoriaResponseDTO> buscarPorId(@PathVariable Long id) {
        ChamadoZeladoriaResponseDTO response = chamadoService.buscarPorId(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ROLE_GESTOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Atualizar status de um chamado", description = "Exclusivo para gestores (ABERTO, EM_ANALISE, EM_EXECUCAO, RESOLVIDO).")
    public ResponseEntity<ChamadoZeladoriaResponseDTO> atualizarStatus(
            @PathVariable Long id,
            @RequestBody @Valid AtualizarStatusChamadoDTO dto
    ) {
        ChamadoZeladoriaResponseDTO response = chamadoService.atualizarStatus(id, dto);
        return ResponseEntity.ok(response);
    }
}
