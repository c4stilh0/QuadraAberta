package com.quadraaberta.api.repository;

import com.quadraaberta.api.entity.AvaliacaoUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AvaliacaoUsuarioRepository extends JpaRepository<AvaliacaoUsuario, Long> {

    boolean existsByPartidaIdAndAvaliadorIdAndAvaliadoId(Long partidaId, Long avaliadorId, Long avaliadoId);

    List<AvaliacaoUsuario> findByPartidaIdAndAvaliadorId(Long partidaId, Long avaliadorId);

    List<AvaliacaoUsuario> findByAvaliadoId(Long avaliadoId);

    long countByAvaliadoId(Long avaliadoId);
}
