package com.quadraaberta.api.dto;

public record ColegaAvaliacaoDTO(
        Long usuarioId,
        String nome,
        String fotoUrl,
        String bairro,
        Double reputacaoAtual,
        String habilidadeDeclarada,
        boolean jaAvaliado
) {}
