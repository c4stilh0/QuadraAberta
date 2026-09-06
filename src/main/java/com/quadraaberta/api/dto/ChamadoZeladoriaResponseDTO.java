package com.quadraaberta.api.dto;

import com.quadraaberta.api.entity.ChamadoZeladoria;
import com.quadraaberta.api.entity.enums.CategoriaChamado;
import com.quadraaberta.api.entity.enums.StatusChamado;

import java.time.LocalDateTime;

public record ChamadoZeladoriaResponseDTO(
        Long id,
        Long quadraId,
        String quadraNome,
        Long autorId,
        String autorNome,
        CategoriaChamado categoria,
        String descricao,
        String fotoUrl,
        StatusChamado status,
        LocalDateTime dataAbertura,
        LocalDateTime dataResolucao
) {
    public static ChamadoZeladoriaResponseDTO fromEntity(ChamadoZeladoria chamado) {
        return new ChamadoZeladoriaResponseDTO(
                chamado.getId(),
                chamado.getQuadra().getId(),
                chamado.getQuadra().getNome(),
                chamado.getAutor().getId(),
                chamado.getAutor().getNome(),
                chamado.getCategoria(),
                chamado.getDescricao(),
                chamado.getFotoUrl(),
                chamado.getStatus(),
                chamado.getDataAbertura(),
                chamado.getDataResolucao()
        );
    }
}
