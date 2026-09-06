package com.quadraaberta.api.service;

import com.quadraaberta.api.dto.AtualizarStatusChamadoDTO;
import com.quadraaberta.api.dto.ChamadoZeladoriaRequestDTO;
import com.quadraaberta.api.dto.ChamadoZeladoriaResponseDTO;
import com.quadraaberta.api.entity.ChamadoZeladoria;
import com.quadraaberta.api.entity.Quadra;
import com.quadraaberta.api.entity.Usuario;
import com.quadraaberta.api.entity.enums.StatusChamado;
import com.quadraaberta.api.exception.EntidadeNaoEncontradaException;
import com.quadraaberta.api.repository.ChamadoZeladoriaRepository;
import com.quadraaberta.api.repository.QuadraRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChamadoZeladoriaService {

    private final ChamadoZeladoriaRepository chamadoRepository;
    private final QuadraRepository quadraRepository;
    private final CloudinaryService cloudinaryService;

    @Transactional
    public ChamadoZeladoriaResponseDTO criar(
            ChamadoZeladoriaRequestDTO dto,
            MultipartFile foto,
            Usuario autor
    ) {
        Quadra quadra = quadraRepository.findById(dto.quadraId())
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Quadra não encontrada com ID: " + dto.quadraId()));

        String fotoUrl = null;
        if (foto != null && !foto.isEmpty()) {
            fotoUrl = cloudinaryService.uploadFoto(foto, "chamados");
        }

        ChamadoZeladoria chamado = ChamadoZeladoria.builder()
                .quadra(quadra)
                .autor(autor)
                .categoria(dto.categoria())
                .descricao(dto.descricao().trim())
                .fotoUrl(fotoUrl)
                .status(StatusChamado.ABERTO)
                .dataAbertura(LocalDateTime.now())
                .build();

        ChamadoZeladoria salvo = chamadoRepository.save(chamado);
        log.info("Chamado de zeladoria #{} aberto para a quadra '{}' pelo morador '{}'",
                salvo.getId(), quadra.getNome(), autor.getNome());

        return ChamadoZeladoriaResponseDTO.fromEntity(salvo);
    }

    @Transactional
    public ChamadoZeladoriaResponseDTO atualizarStatus(Long id, AtualizarStatusChamadoDTO dto) {
        ChamadoZeladoria chamado = chamadoRepository.findById(id)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Chamado não encontrado com ID: " + id));

        chamado.setStatus(dto.status());

        if (dto.status() == StatusChamado.RESOLVIDO) {
            chamado.setDataResolucao(LocalDateTime.now());
        } else {
            chamado.setDataResolucao(null);
        }

        log.info("Status do chamado #{} alterado para {}", id, dto.status());
        return ChamadoZeladoriaResponseDTO.fromEntity(chamado);
    }

    public List<ChamadoZeladoriaResponseDTO> listarTodos() {
        return chamadoRepository.findAllByOrderByDataAberturaDesc().stream()
                .map(ChamadoZeladoriaResponseDTO::fromEntity)
                .toList();
    }

    public List<ChamadoZeladoriaResponseDTO> listarPorQuadra(Long quadraId) {
        return chamadoRepository.findByQuadraIdOrderByDataAberturaDesc(quadraId).stream()
                .map(ChamadoZeladoriaResponseDTO::fromEntity)
                .toList();
    }

    public List<ChamadoZeladoriaResponseDTO> listarPorAutor(Long autorId) {
        return chamadoRepository.findByAutorIdOrderByDataAberturaDesc(autorId).stream()
                .map(ChamadoZeladoriaResponseDTO::fromEntity)
                .toList();
    }

    public ChamadoZeladoriaResponseDTO buscarPorId(Long id) {
        return chamadoRepository.findById(id)
                .map(ChamadoZeladoriaResponseDTO::fromEntity)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Chamado não encontrado com ID: " + id));
    }
}
