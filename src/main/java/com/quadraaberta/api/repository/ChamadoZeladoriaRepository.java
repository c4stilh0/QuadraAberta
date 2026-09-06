package com.quadraaberta.api.repository;

import com.quadraaberta.api.entity.ChamadoZeladoria;
import com.quadraaberta.api.entity.enums.StatusChamado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChamadoZeladoriaRepository extends JpaRepository<ChamadoZeladoria, Long> {

    List<ChamadoZeladoria> findByQuadraIdOrderByDataAberturaDesc(Long quadraId);

    List<ChamadoZeladoria> findByAutorIdOrderByDataAberturaDesc(Long autorId);

    List<ChamadoZeladoria> findByStatusOrderByDataAberturaDesc(StatusChamado status);

    List<ChamadoZeladoria> findAllByOrderByDataAberturaDesc();
}
