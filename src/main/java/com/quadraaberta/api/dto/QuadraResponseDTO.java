package com.quadraaberta.api.dto;

import com.quadraaberta.api.entity.Quadra;
import com.quadraaberta.api.entity.enums.StatusQuadra;
import com.quadraaberta.api.entity.enums.TipoPiso;

public record QuadraResponseDTO(
        Long id,
        String nome,
        String bairro,
        String logradouro,
        String cep,
        TipoPiso tipoPiso,
        Boolean possuiIluminacao,
        StatusQuadra status
) {
    public static QuadraResponseDTO fromEntity(Quadra quadra) {
        return new QuadraResponseDTO(
                quadra.getId(),
                quadra.getNome(),
                quadra.getBairro(),
                quadra.getLogradouro(),
                quadra.getCep(),
                quadra.getTipoPiso(),
                quadra.getPossuiIluminacao(),
                quadra.getStatus()
        );
    }
}
