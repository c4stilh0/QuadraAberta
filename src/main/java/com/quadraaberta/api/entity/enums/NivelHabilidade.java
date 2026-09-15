package com.quadraaberta.api.entity.enums;

import lombok.Getter;

@Getter
public enum NivelHabilidade {
    JOGADOR_INICIANTE(1.0, "Jogador Iniciante", "Aprendendo regras e fundamentos recreativos"),
    JOGADOR_CASUAL(2.0, "Jogador Casual", "Joga esporadicamente por diversão"),
    JOGADOR_AMADOR(3.0, "Jogador Amador", "Prática frequente com bom ritmo e técnica"),
    JOGADOR_PROFISSIONAL(4.0, "Jogador Profissional", "Alto rendimento e nível de competição");

    private final double peso;
    private final String descricao;
    private final String detalhes;

    NivelHabilidade(double peso, String descricao, String detalhes) {
        this.peso = peso;
        this.descricao = descricao;
        this.detalhes = detalhes;
    }

    public static NivelHabilidade fromPeso(Double peso) {
        if (peso == null) return JOGADOR_CASUAL;
        if (peso < 1.5) return JOGADOR_INICIANTE;
        if (peso < 2.5) return JOGADOR_CASUAL;
        if (peso < 3.5) return JOGADOR_AMADOR;
        return JOGADOR_PROFISSIONAL;
    }
}
