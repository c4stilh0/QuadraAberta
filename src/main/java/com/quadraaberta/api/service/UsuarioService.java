package com.quadraaberta.api.service;

import com.quadraaberta.api.dto.CadastroUsuarioRequestDTO;
import com.quadraaberta.api.dto.LoginRequestDTO;
import com.quadraaberta.api.dto.LoginResponseDTO;
import com.quadraaberta.api.dto.UsuarioResponseDTO;
import com.quadraaberta.api.dto.AtualizarPerfilRequestDTO;
import com.quadraaberta.api.dto.PerfilUsuarioResponseDTO;
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
    private final CloudinaryService cloudinaryService;

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
                usuario.getRole(),
                usuario.getFotoUrl(),
                usuario.getObjetivo()
        );
    }

    public PerfilUsuarioResponseDTO obterPerfil(Long usuarioId) {
        Usuario usuario = buscarPorId(usuarioId);
        return PerfilUsuarioResponseDTO.fromEntity(usuario);
    }

    @Transactional
    public PerfilUsuarioResponseDTO atualizarPerfil(Long usuarioId, AtualizarPerfilRequestDTO dto) {
        Usuario usuario = buscarPorId(usuarioId);

        usuario.setNome(dto.nome().trim());
        if (dto.telefone() != null) {
            usuario.setTelefone(dto.telefone().trim());
        }
        usuario.setObjetivo(dto.objetivo());

        // Transição de papel baseada no objetivo comunitário (preservando gestor)
        if (usuario.getRole() != com.quadraaberta.api.entity.enums.Role.ROLE_GESTOR) {
            if (dto.objetivo() == com.quadraaberta.api.entity.enums.ObjetivoUsuario.PROMOVER_AULAS ||
                dto.objetivo() == com.quadraaberta.api.entity.enums.ObjetivoUsuario.AMBOS) {
                usuario.setRole(com.quadraaberta.api.entity.enums.Role.ROLE_VOLUNTARIO);
            } else if (dto.objetivo() == com.quadraaberta.api.entity.enums.ObjetivoUsuario.PRATICAR_ESPORTES) {
                usuario.setRole(com.quadraaberta.api.entity.enums.Role.ROLE_COMUNIDADE);
            }
        }

        Usuario salvo = usuarioRepository.save(usuario);
        return PerfilUsuarioResponseDTO.fromEntity(salvo);
    }

    @Transactional
    public PerfilUsuarioResponseDTO atualizarFotoPerfil(Long usuarioId, org.springframework.web.multipart.MultipartFile foto) {
        Usuario usuario = buscarPorId(usuarioId);

        String fotoUrl = cloudinaryService.uploadFoto(foto, "perfis");
        if (fotoUrl != null) {
            usuario.setFotoUrl(fotoUrl);
            usuarioRepository.save(usuario);
        }

        return PerfilUsuarioResponseDTO.fromEntity(usuario);
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
