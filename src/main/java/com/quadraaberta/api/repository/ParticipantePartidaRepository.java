package com.quadraaberta.api.repository;

import com.quadraaberta.api.entity.ParticipantePartida;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ParticipantePartidaRepository extends JpaRepository<ParticipantePartida, Long> {

    List<ParticipantePartida> findByPartidaIdOrderByConfirmadoEmAsc(Long partidaId);

    Optional<ParticipantePartida> findByPartidaIdAndUsuarioId(Long partidaId, Long usuarioId);

    boolean existsByPartidaIdAndUsuarioId(Long partidaId, Long usuarioId);

    long countByPartidaId(Long partidaId);
}
