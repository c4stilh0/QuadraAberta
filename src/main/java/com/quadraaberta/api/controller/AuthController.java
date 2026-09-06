package com.quadraaberta.api.controller;

import com.quadraaberta.api.dto.CadastroUsuarioRequestDTO;
import com.quadraaberta.api.dto.LoginRequestDTO;
import com.quadraaberta.api.dto.LoginResponseDTO;
import com.quadraaberta.api.dto.UsuarioResponseDTO;
import com.quadraaberta.api.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticação", description = "Endpoints para cadastro de novos usuários e autenticação via JWT")
public class AuthController {

    private final UsuarioService usuarioService;

    @PostMapping("/cadastrar")
    @Operation(summary = "Cadastrar novo usuário", description = "Permite registrar moradores, voluntários ou gestores.")
    public ResponseEntity<UsuarioResponseDTO> cadastrar(@RequestBody @Valid CadastroUsuarioRequestDTO dto) {
        UsuarioResponseDTO response = usuarioService.cadastrar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Autenticar usuário", description = "Retorna um token JWT para autorização em rotas protegidas.")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody @Valid LoginRequestDTO dto) {
        LoginResponseDTO response = usuarioService.autenticar(dto);
        return ResponseEntity.ok(response);
    }
}
