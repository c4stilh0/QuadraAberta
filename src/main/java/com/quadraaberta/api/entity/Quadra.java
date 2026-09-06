package com.quadraaberta.api.entity;

import com.quadraaberta.api.entity.enums.StatusQuadra;
import com.quadraaberta.api.entity.enums.TipoPiso;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tb_quadra")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class Quadra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, length = 80)
    private String bairro;

    @Column(nullable = false, length = 150)
    private String logradouro;

    @Column(length = 10)
    private String cep;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_piso", nullable = false, length = 50)
    private TipoPiso tipoPiso;

    @Column(name = "possui_iluminacao", nullable = false)
    @Builder.Default
    private Boolean possuiIluminacao = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private StatusQuadra status = StatusQuadra.DISPONIVEL;
}
