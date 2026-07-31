package com.fitveda.service;

import com.fitveda.dto.ProgressRequest;
import com.fitveda.dto.ProgressSummaryResponse;
import com.fitveda.model.Exercise;
import com.fitveda.model.Plan;
import com.fitveda.model.ProgressLog;
import com.fitveda.model.User;
import com.fitveda.repository.ExerciseRepository;
import com.fitveda.repository.PlanRepository;
import com.fitveda.repository.ProgressLogRepository;
import com.fitveda.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class ProgressService {

    private final ProgressLogRepository progressLogRepository;
    private final ExerciseRepository exerciseRepository;
    private final UserRepository userRepository;
    private final PlanRepository planRepository;

    public ProgressService(ProgressLogRepository progressLogRepository, ExerciseRepository exerciseRepository, UserRepository userRepository, PlanRepository planRepository) {
        this.progressLogRepository = progressLogRepository;
        this.exerciseRepository = exerciseRepository;
        this.userRepository = userRepository;
        this.planRepository = planRepository;
    }

    @Transactional
    public ProgressLog logProgress(ProgressRequest req, Long clientId) {
        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("Client not found"));

        Exercise exercise = exerciseRepository.findById(req.getExerciseId())
                .orElseThrow(() -> new IllegalArgumentException("Exercise not found"));

        LocalDate today = LocalDate.now();

        // Check if progress log already exists for today -> update (upsert)
        Optional<ProgressLog> existingLog = progressLogRepository.findByClientIdAndExerciseIdAndDate(clientId, req.getExerciseId(), today);

        ProgressLog log;
        if (existingLog.isPresent()) {
            log = existingLog.get();
            log.setStatus(req.getStatus());
            log.setNotes(req.getNotes());
        } else {
            log = new ProgressLog();
            log.setClient(client);
            log.setExercise(exercise);
            log.setDate(today);
            log.setStatus(req.getStatus());
            log.setNotes(req.getNotes());
        }

        return progressLogRepository.save(log);
    }

    public List<ProgressSummaryResponse> getProgressSummary(Long clientId, Long requestingTrainerId) {
        LocalDate today = LocalDate.now();

        Optional<Plan> activePlanOpt = planRepository.findByClientIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(clientId, today, today);
        if (activePlanOpt.isEmpty()) {
            return Collections.emptyList();
        }

        Plan plan = activePlanOpt.get();
        if (plan.getTrainer() == null || !plan.getTrainer().getId().equals(requestingTrainerId)) {
            throw new IllegalArgumentException("Access denied: Client is not assigned to requesting trainer");
        }

        List<ProgressLog> logs = progressLogRepository.findByClientIdAndDateBetween(clientId, plan.getStartDate(), today);
        Map<LocalDate, List<ProgressLog>> logsByDate = new HashMap<>();
        for (ProgressLog l : logs) {
            logsByDate.computeIfAbsent(l.getDate(), k -> new ArrayList<>()).add(l);
        }

        List<ProgressSummaryResponse> summary = new ArrayList<>();
        LocalDate current = plan.getStartDate();

        while (!current.isAfter(today)) {
            int dayNumber = (int) ChronoUnit.DAYS.between(plan.getStartDate(), current) + 1;
            List<Exercise> dayExercises = exerciseRepository.findByPlanIdAndDayNumber(plan.getId(), dayNumber);
            int totalExercises = dayExercises.size();

            List<ProgressLog> dayLogs = logsByDate.getOrDefault(current, Collections.emptyList());
            long completedCount = dayLogs.stream().filter(l -> l.getStatus() == com.fitveda.model.LogStatus.COMPLETED).count();

            int percent = totalExercises == 0 ? 0 : (int) Math.round(((double) completedCount / totalExercises) * 100);

            summary.add(new ProgressSummaryResponse(current, totalExercises, (int) completedCount, percent));
            current = current.plusDays(1);
        }

        return summary;
    }
}
