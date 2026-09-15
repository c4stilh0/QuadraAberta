package com.quadraaberta.api.entity;

import com.quadraaberta.api.entity.enums.StatusPartida;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tb_partida_match")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class PartidaMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "criador_id", nullable = false)
    private Usuario criador;

    @Column(nullable = false, length = 50)
    private String esporte;

    @Column(name = "data_hora", nullable = false)
    private LocalDateTime dataHora;

    @Column(name = "duracao_minutos", nullable = false)
    @Builder.Default
    private Integer duracaoMinutos = 60;

    @Column(name = "min_jogadores", nullable = false)
    @Builder.Default
    private Integer minJogadores = 10;

    @Column(name = "max_jogadores", nullable = false)
    @Builder.Default
    private Integer maxJogadores = 14;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "bairro_criador", nullable = false, length = 100)
    private String bairroCriador;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private StatusPartida status = StatusPartida.BUSCANDO_JOGADORES;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quadra_escolhida_id")
    private Quadra quadraEscolhida;

    @Column(name = "centroide_lat")
    private Double centroideLat;

    @Column(name = "centroide_lng")
    private Double centroideLng;

    @Column(name = "criado_em", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime criadoEm = LocalDateTime.now();

    @OneToMany(mappedBy = "partida", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ParticipantePartida> participantes = new ArrayList<>();
}
