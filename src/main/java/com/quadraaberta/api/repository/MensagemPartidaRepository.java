package com.quadraaberta.api.repository;

import com.quadraaberta.api.entity.MensagemPartida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MensagemPartidaRepository extends JpaRepository<MensagemPartida, Long> {

    @Query("SELECT m FROM MensagemPartida m LEFT JOIN FETCH m.usuario WHERE m.partida.id = :partidaId ORDER BY m.criadoEm ASC")
    List<MensagemPartida> findByPartidaIdComUsuarioOrderByCriadoEmAsc(@Param("partidaId") Long partidaId);

    long countByPartidaId(Long partidaId);
}
