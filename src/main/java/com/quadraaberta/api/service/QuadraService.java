package com.quadraaberta.api.service;

import com.quadraaberta.api.dto.QuadraRequestDTO;
import com.quadraaberta.api.dto.QuadraResponseDTO;
import com.quadraaberta.api.entity.Quadra;
import com.quadraaberta.api.entity.enums.StatusQuadra;
import com.quadraaberta.api.exception.EntidadeNaoEncontradaException;
import com.quadraaberta.api.repository.QuadraRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuadraService {

    private final QuadraRepository quadraRepository;

    @Transactional
    public QuadraResponseDTO criar(QuadraRequestDTO dto) {
        Quadra quadra = Quadra.builder()
                .nome(dto.nome().trim())
                .bairro(dto.bairro().trim())
                .logradouro(dto.logradouro().trim())
                .cep(dto.cep() != null ? dto.cep().trim() : null)
                .tipoPiso(dto.tipoPiso())
                .possuiIluminacao(dto.possuiIluminacao())
                .latitude(dto.latitude())
                .longitude(dto.longitude())
                .modalidades(dto.modalidades() != null ? dto.modalidades().trim() : null)
                .status(dto.status())
                .build();

        Quadra salva = quadraRepository.save(quadra);
        return QuadraResponseDTO.fromEntity(salva);
    }

    @Transactional
    public QuadraResponseDTO atualizar(Long id, QuadraRequestDTO dto) {
        Quadra quadra = buscarEntidadePorId(id);

        quadra.setNome(dto.nome().trim());
        quadra.setBairro(dto.bairro().trim());
        quadra.setLogradouro(dto.logradouro().trim());
        quadra.setCep(dto.cep() != null ? dto.cep().trim() : null);
        quadra.setTipoPiso(dto.tipoPiso());
        quadra.setPossuiIluminacao(dto.possuiIluminacao());
        quadra.setLatitude(dto.latitude());
        quadra.setLongitude(dto.longitude());
        quadra.setModalidades(dto.modalidades() != null ? dto.modalidades().trim() : null);
        quadra.setStatus(dto.status());

        return QuadraResponseDTO.fromEntity(quadra);
    }

    public QuadraResponseDTO buscarPorId(Long id) {
        return QuadraResponseDTO.fromEntity(buscarEntidadePorId(id));
    }

    public List<QuadraResponseDTO> listar(StatusQuadra status, String bairro) {
        List<Quadra> quadras;

        if (status != null) {
            quadras = quadraRepository.findByStatus(status);
        } else if (bairro != null && !bairro.isBlank()) {
            quadras = quadraRepository.findByBairroIgnoreCase(bairro.trim());
        } else {
            quadras = quadraRepository.findAll();
        }

        return quadras.stream()
                .map(QuadraResponseDTO::fromEntity)
                .toList();
    }

    @Transactional
    public void excluir(Long id) {
        Quadra quadra = buscarEntidadePorId(id);
        quadraRepository.delete(quadra);
    }

    public Quadra buscarEntidadePorId(Long id) {
        return quadraRepository.findById(id)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Quadra não encontrada com o ID: " + id));
    }
}
