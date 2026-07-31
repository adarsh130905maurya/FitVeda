package com.fitveda.repository;

import com.fitveda.model.ProgressLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProgressLogRepository extends JpaRepository<ProgressLog, Long> {

    List<ProgressLog> findByClientIdAndDateBetween(Long clientId, LocalDate start, LocalDate end);

    Optional<ProgressLog> findByClientIdAndExerciseIdAndDate(Long clientId, Long exerciseId, LocalDate date);
}
