package com.quadraaberta.api.repository;

import com.quadraaberta.api.entity.PartidaMatch;
import com.quadraaberta.api.entity.enums.StatusPartida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PartidaMatchRepository extends JpaRepository<PartidaMatch, Long> {

    List<PartidaMatch> findByStatusOrderByDataHoraAsc(StatusPartida status);

    @Query("""
        SELECT p FROM PartidaMatch p
        LEFT JOIN FETCH p.criador
        LEFT JOIN FETCH p.quadraEscolhida
        WHERE p.status IN (:statusList)
        AND p.dataHora >= :dataMinima
        ORDER BY p.dataHora ASC
    """)
    List<PartidaMatch> buscarPartidasAtivas(
            @Param("statusList") List<StatusPartida> statusList,
            @Param("dataMinima") LocalDateTime dataMinima
    );

    @Query("""
        SELECT DISTINCT p FROM PartidaMatch p
        JOIN p.participantes part
        WHERE part.usuario.id = :usuarioId
        AND p.status IN (:statusList)
        ORDER BY p.dataHora DESC
    """)
    List<PartidaMatch> findMinhasPartidas(
            @Param("usuarioId") Long usuarioId,
            @Param("statusList") List<StatusPartida> statusList
    );

    @Query("""
        SELECT p FROM PartidaMatch p
        WHERE p.quadraEscolhida.id = :quadraId
        AND p.status = :status
        AND p.id <> :partidaIdExcluir
        AND p.dataHora BETWEEN :janelaInicio AND :janelaFim
    """)
    List<PartidaMatch> findPartidasFixadasNaQuadraNoPeriodo(
            @Param("quadraId") Long quadraId,
            @Param("status") StatusPartida status,
            @Param("partidaIdExcluir") Long partidaIdExcluir,
            @Param("janelaInicio") LocalDateTime janelaInicio,
            @Param("janelaFim") LocalDateTime janelaFim
    );
}
