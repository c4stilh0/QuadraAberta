package com.quadraaberta.api.entity;

import com.quadraaberta.api.entity.enums.CategoriaChamado;
import com.quadraaberta.api.entity.enums.StatusChamado;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tb_chamado_zeladoria")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class ChamadoZeladoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quadra_id", nullable = false)
    private Quadra quadra;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "autor_id", nullable = false)
    private Usuario autor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private CategoriaChamado categoria;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "foto_url", length = 500)
    private String fotoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private StatusChamado status = StatusChamado.ABERTO;

    @Column(name = "data_abertura", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime dataAbertura = LocalDateTime.now();

    @Column(name = "data_resolucao")
    private LocalDateTime dataResolucao;
}
