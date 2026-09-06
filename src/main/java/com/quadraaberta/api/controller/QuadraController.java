package com.quadraaberta.api.controller;

import com.quadraaberta.api.dto.QuadraRequestDTO;
import com.quadraaberta.api.dto.QuadraResponseDTO;
import com.quadraaberta.api.entity.enums.StatusQuadra;
import com.quadraaberta.api.service.QuadraService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quadras")
@RequiredArgsConstructor
@Tag(name = "Quadras Poliesportivas", description = "Endpoints para consulta pública e gerenciamento de quadras comunitárias")
public class QuadraController {

    private final QuadraService quadraService;

    @GetMapping
    @Operation(summary = "Listar quadras públicas", description = "Permite filtrar quadras por status (ex: DISPONIVEL) ou por bairro.")
    public ResponseEntity<List<QuadraResponseDTO>> listar(
            @RequestParam(required = false) StatusQuadra status,
            @RequestParam(required = false) String bairro
    ) {
        List<QuadraResponseDTO> quadras = quadraService.listar(status, bairro);
        return ResponseEntity.ok(quadras);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar detalhes de uma quadra pelo ID")
    public ResponseEntity<QuadraResponseDTO> buscarPorId(@PathVariable Long id) {
        QuadraResponseDTO response = quadraService.buscarPorId(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_GESTOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Cadastrar nova quadra pública", description = "Exclusivo para usuários com perfil GESTOR.")
    public ResponseEntity<QuadraResponseDTO> criar(@RequestBody @Valid QuadraRequestDTO dto) {
        QuadraResponseDTO response = quadraService.criar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_GESTOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Atualizar informações de uma quadra", description = "Exclusivo para usuários com perfil GESTOR.")
    public ResponseEntity<QuadraResponseDTO> atualizar(
            @PathVariable Long id,
            @RequestBody @Valid QuadraRequestDTO dto
    ) {
        QuadraResponseDTO response = quadraService.atualizar(id, dto);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_GESTOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Remover quadra do sistema", description = "Exclusivo para usuários com perfil GESTOR.")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        quadraService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
