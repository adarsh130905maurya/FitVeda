package com.fitveda.repository;

import com.fitveda.model.Exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExerciseRepository extends JpaRepository<Exercise, Long> {

    List<Exercise> findByPlanIdAndDayNumber(Long planId, int dayNumber);

    List<Exercise> findByPlanId(Long planId);
}
