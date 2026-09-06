package com.quadraaberta.api.repository;

import com.quadraaberta.api.entity.TurmaSocial;
import com.quadraaberta.api.entity.enums.DiaSemana;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;

@Repository
public interface TurmaSocialRepository extends JpaRepository<TurmaSocial, Long> {

    List<TurmaSocial> findByQuadraIdAndAtivoTrue(Long quadraId);

    List<TurmaSocial> findByInstrutorId(Long instrutorId);

    @Query("""
        SELECT t FROM TurmaSocial t
        WHERE t.quadra.id = :quadraId
          AND t.ativo = true
          AND t.diaSemana = :diaSemana
          AND t.horarioInicio < :horarioFim
          AND t.horarioFim > :horarioInicio
    """)
    List<TurmaSocial> findConflitosTurma(
        @Param("quadraId") Long quadraId,
        @Param("diaSemana") DiaSemana diaSemana,
        @Param("horarioInicio") LocalTime horarioInicio,
        @Param("horarioFim") LocalTime horarioFim
    );
}
