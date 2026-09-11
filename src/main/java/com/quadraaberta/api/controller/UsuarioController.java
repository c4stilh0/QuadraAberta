package com.quadraaberta.api.controller;

import com.quadraaberta.api.dto.AtualizarPerfilRequestDTO;
import com.quadraaberta.api.dto.PerfilUsuarioResponseDTO;
import com.quadraaberta.api.entity.Usuario;
import com.quadraaberta.api.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@Tag(name = "Usuários e Perfil", description = "Endpoints para consulta e atualização de perfil do morador / voluntário")
@SecurityRequirement(name = "bearerAuth")
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping("/perfil")
    @Operation(summary = "Obter perfil do usuário autenticado", description = "Retorna os dados cadastrais, foto e objetivo comunitário do usuário logado.")
    public ResponseEntity<PerfilUsuarioResponseDTO> obterPerfil(@AuthenticationPrincipal Usuario usuarioLogado) {
        PerfilUsuarioResponseDTO response = usuarioService.obterPerfil(usuarioLogado.getId());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/perfil")
    @Operation(summary = "Atualizar dados do perfil", description = "Permite alterar nome, telefone e objetivo comunitário (praticar esportes vs promover aulas).")
    public ResponseEntity<PerfilUsuarioResponseDTO> atualizarPerfil(
            @AuthenticationPrincipal Usuario usuarioLogado,
            @RequestBody @Valid AtualizarPerfilRequestDTO dto
    ) {
        PerfilUsuarioResponseDTO response = usuarioService.atualizarPerfil(usuarioLogado.getId(), dto);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/perfil/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Atualizar foto de perfil", description = "Faz upload da imagem para o Cloudinary (ou armazenamento local) e atualiza a foto do perfil do usuário.")
    public ResponseEntity<PerfilUsuarioResponseDTO> atualizarFoto(
            @AuthenticationPrincipal Usuario usuarioLogado,
            @RequestParam(value = "foto", required = false) MultipartFile foto,
            @RequestParam(value = "arquivo", required = false) MultipartFile arquivo
    ) {
        MultipartFile file = foto != null ? foto : arquivo;
        if (file == null || file.isEmpty()) {
            throw new com.quadraaberta.api.exception.ValidacaoNegocioException("Nenhum arquivo de imagem foi enviado.");
        }
        PerfilUsuarioResponseDTO response = usuarioService.atualizarFotoPerfil(usuarioLogado.getId(), file);
        return ResponseEntity.ok(response);
    }
}
