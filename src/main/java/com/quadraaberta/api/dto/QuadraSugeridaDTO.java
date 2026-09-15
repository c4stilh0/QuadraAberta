package com.quadraaberta.api.dto;

import com.quadraaberta.api.entity.Quadra;

public record QuadraSugeridaDTO(
        Long quadraId,
        String nome,
        String bairro,
        String logradouro,
        Double latitude,
        Double longitude,
        Double distanciaMediaKm,
        String modalidades,
        String tipoPiso,
        Boolean possuiIluminacao,
        String fotoUrl
) {
    public static QuadraSugeridaDTO fromQuadraEDistancia(Quadra q, double distanciaMediaKm) {
        return new QuadraSugeridaDTO(
                q.getId(),
                q.getNome(),
                q.getBairro(),
                q.getLogradouro(),
                q.getLatitude() != null ? q.getLatitude().doubleValue() : null,
                q.getLongitude() != null ? q.getLongitude().doubleValue() : null,
                Math.round(distanciaMediaKm * 10.0) / 10.0,
                q.getModalidades(),
                q.getTipoPiso() != null ? q.getTipoPiso().name() : null,
                q.getPossuiIluminacao(),
                null
        );
    }
}
