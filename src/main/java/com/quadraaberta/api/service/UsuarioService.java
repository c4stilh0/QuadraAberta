package com.quadraaberta.api.service;

import com.quadraaberta.api.dto.CadastroUsuarioRequestDTO;
import com.quadraaberta.api.dto.LoginRequestDTO;
import com.quadraaberta.api.dto.LoginResponseDTO;
import com.quadraaberta.api.dto.UsuarioResponseDTO;
import com.quadraaberta.api.entity.Usuario;
import com.quadraaberta.api.exception.EntidadeNaoEncontradaException;
import com.quadraaberta.api.exception.ValidacaoNegocioException;
import com.quadraaberta.api.repository.UsuarioRepository;
import com.quadraaberta.api.security.TokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;

    @Transactional
    public UsuarioResponseDTO cadastrar(CadastroUsuarioRequestDTO dto) {
        if (usuarioRepository.existsByEmail(dto.email())) {
            throw new ValidacaoNegocioException("Já existe um usuário cadastrado com este e-mail.");
        }

        if (usuarioRepository.existsByCpf(dto.cpf())) {
            throw new ValidacaoNegocioException("Já existe um usuário cadastrado com este CPF.");
        }

        Usuario novoUsuario = Usuario.builder()
                .nome(dto.nome().trim())
                .email(dto.email().trim().toLowerCase())
                .telefone(dto.telefone())
                .cpf(dto.cpf().replaceAll("\\D", ""))
                .senhaHash(passwordEncoder.encode(dto.senha()))
                .role(dto.role())
                .ativo(true)
                .build();

        Usuario salvo = usuarioRepository.save(novoUsuario);
        return UsuarioResponseDTO.fromEntity(salvo);
    }

    public LoginResponseDTO autenticar(LoginRequestDTO dto) {
        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(dto.email().trim().toLowerCase(), dto.senha());

        Authentication auth = authenticationManager.authenticate(authToken);
        Usuario usuario = (Usuario) auth.getPrincipal();

        String token = tokenService.gerarToken(usuario);

        return new LoginResponseDTO(
                token,
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getRole()
        );
    }

    public Usuario buscarPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Usuário não encontrado com o ID: " + id));
    }

    public Usuario buscarPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Usuário não encontrado com o e-mail: " + email));
    }
}
