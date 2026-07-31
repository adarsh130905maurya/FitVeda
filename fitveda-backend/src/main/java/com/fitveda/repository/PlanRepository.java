package com.fitveda.repository;

import com.fitveda.model.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlanRepository extends JpaRepository<Plan, Long> {

    List<Plan> findByTrainerId(Long trainerId);

    @Query("SELECT p FROM Plan p WHERE p.client.id = :clientId AND p.startDate <= :endDate AND p.endDate >= :startDate")
    List<Plan> findOverlappingPlansForClient(
            @Param("clientId") Long clientId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    Optional<Plan> findByClientIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long clientId, LocalDate today1, LocalDate today2);
}
