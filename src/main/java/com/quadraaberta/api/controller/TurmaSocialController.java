package com.quadraaberta.api.controller;

import com.quadraaberta.api.dto.TurmaSocialRequestDTO;
import com.quadraaberta.api.dto.TurmaSocialResponseDTO;
import com.quadraaberta.api.entity.Usuario;
import com.quadraaberta.api.service.TurmaSocialService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/turmas")
@RequiredArgsConstructor
@Tag(name = "Turmas Sociais", description = "Endpoints para projetos sociais contínuos, oficinas esportivas e voluntariado")
public class TurmaSocialController {

    private final TurmaSocialService turmaSocialService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_VOLUNTARIO', 'ROLE_GESTOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
            summary = "Cadastrar nova turma social contínua",
            description = "Exclusivo para voluntários ou gestores. As turmas têm ocupação prioritária e bloqueiam partidas avulsas."
    )
    public ResponseEntity<TurmaSocialResponseDTO> criar(
            @RequestBody @Valid TurmaSocialRequestDTO dto,
            @AuthenticationPrincipal Usuario instrutor
    ) {
        TurmaSocialResponseDTO response = turmaSocialService.criar(dto, instrutor);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "Listar todas as turmas sociais cadastradas")
    public ResponseEntity<List<TurmaSocialResponseDTO>> listarTodas() {
        List<TurmaSocialResponseDTO> turmas = turmaSocialService.listarTodas();
        return ResponseEntity.ok(turmas);
    }

    @GetMapping("/quadra/{quadraId}")
    @Operation(summary = "Listar turmas sociais de uma quadra específica")
    public ResponseEntity<List<TurmaSocialResponseDTO>> listarPorQuadra(@PathVariable Long quadraId) {
        List<TurmaSocialResponseDTO> turmas = turmaSocialService.listarPorQuadra(quadraId);
        return ResponseEntity.ok(turmas);
    }
}
