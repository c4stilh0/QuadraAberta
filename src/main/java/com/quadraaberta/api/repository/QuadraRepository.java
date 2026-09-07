package com.quadraaberta.api.repository;

import com.quadraaberta.api.entity.Quadra;
import com.quadraaberta.api.entity.enums.StatusQuadra;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuadraRepository extends JpaRepository<Quadra, Long> {

    List<Quadra> findByStatus(StatusQuadra status);

    List<Quadra> findByBairroIgnoreCase(String bairro);

    boolean existsByNome(String nome);

    Optional<Quadra> findByNome(String nome);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT q FROM Quadra q WHERE q.id = :id")
    Optional<Quadra> findByIdWithLock(@Param("id") Long id);
}
