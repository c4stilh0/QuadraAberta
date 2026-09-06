package com.quadraaberta.api.controller;

import com.quadraaberta.api.dto.ReservaRequestDTO;
import com.quadraaberta.api.dto.ReservaResponseDTO;
import com.quadraaberta.api.entity.Usuario;
import com.quadraaberta.api.service.ReservaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/reservas")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Reservas de Quadras", description = "Endpoints para agendamento de partidas e controle de concorrência/antimonopólio")
public class ReservaController {

    private final ReservaService reservaService;

    @PostMapping
    @Operation(
            summary = "Criar agendamento de quadra",
            description = "Aplica validações de double booking com lock pessimista, antimonopólio (máx 2 reservas ativas) e teto de 2 horas."
    )
    public ResponseEntity<ReservaResponseDTO> criar(
            @RequestBody @Valid ReservaRequestDTO dto,
            @AuthenticationPrincipal Usuario usuario
    ) {
        ReservaResponseDTO response = reservaService.criar(dto, usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/minhas")
    @Operation(summary = "Listar reservas do usuário autenticado")
    public ResponseEntity<List<ReservaResponseDTO>> listarMinhas(@AuthenticationPrincipal Usuario usuario) {
        List<ReservaResponseDTO> reservas = reservaService.listarMinhasReservas(usuario.getId());
        return ResponseEntity.ok(reservas);
    }

    @GetMapping("/quadra/{quadraId}")
    @Operation(summary = "Listar reservas confirmadas de uma quadra específica em um intervalo de datas")
    public ResponseEntity<List<ReservaResponseDTO>> listarPorQuadra(
            @PathVariable Long quadraId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim
    ) {
        List<ReservaResponseDTO> reservas = reservaService.listarPorQuadra(quadraId, inicio, fim);
        return ResponseEntity.ok(reservas);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Cancelar reserva", description = "Permitido apenas ao autor da reserva ou a um gestor.")
    public ResponseEntity<Void> cancelar(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario
    ) {
        reservaService.cancelar(id, usuario);
        return ResponseEntity.noContent().build();
    }
}
