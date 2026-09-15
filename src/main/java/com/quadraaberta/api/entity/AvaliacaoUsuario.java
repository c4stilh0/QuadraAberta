package com.quadraaberta.api.entity;

import com.quadraaberta.api.entity.enums.NivelHabilidade;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "tb_avaliacao_usuario",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_avaliacao_partida_par",
        columnNames = {"partida_id", "avaliador_id", "avaliado_id"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class AvaliacaoUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "avaliador_id", nullable = false)
    private Usuario avaliador;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "avaliado_id", nullable = false)
    private Usuario avaliado;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "partida_id", nullable = false)
    private PartidaMatch partida;

    @Column(name = "nota_reputacao", nullable = false)
    private Integer notaReputacao;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_habilidade", length = 30)
    private NivelHabilidade nivelHabilidade;

    @Column(length = 255)
    private String comentario;

    @Column(name = "criado_em", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime criadoEm = LocalDateTime.now();
}
