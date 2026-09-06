package com.quadraaberta.api.repository;

import com.quadraaberta.api.entity.Reserva;
import com.quadraaberta.api.entity.enums.StatusReserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    @Query("""
        SELECT r FROM Reserva r
        WHERE r.quadra.id = :quadraId
          AND r.status = :status
          AND r.dataInicio < :dataFim
          AND r.dataFim > :dataInicio
    """)
    List<Reserva> findSobreposicoes(
        @Param("quadraId") Long quadraId,
        @Param("dataInicio") LocalDateTime dataInicio,
        @Param("dataFim") LocalDateTime dataFim,
        @Param("status") StatusReserva status
    );

    @Query("""
        SELECT COUNT(r) FROM Reserva r
        WHERE r.usuario.id = :usuarioId
          AND r.status = :status
          AND r.dataFim > :agora
    """)
    long countReservasFuturasAtivas(
        @Param("usuarioId") Long usuarioId,
        @Param("status") StatusReserva status,
        @Param("agora") LocalDateTime agora
    );

    List<Reserva> findByUsuarioIdOrderByDataInicioDesc(Long usuarioId);

    List<Reserva> findByQuadraIdAndStatusAndDataInicioBetween(
        Long quadraId,
        StatusReserva status,
        LocalDateTime inicio,
        LocalDateTime fim
    );
}
