package com.fitveda.service;

import com.fitveda.dto.ExerciseRequest;
import com.fitveda.dto.ExerciseResponse;
import com.fitveda.dto.PlanRequest;
import com.fitveda.dto.PlanResponse;
import com.fitveda.dto.ClientResponse;
import com.fitveda.model.Exercise;
import com.fitveda.model.Plan;
import com.fitveda.model.Role;
import com.fitveda.model.User;
import com.fitveda.repository.ExerciseRepository;
import com.fitveda.repository.PlanRepository;
import com.fitveda.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PlanService {

    private final PlanRepository planRepository;
    private final ExerciseRepository exerciseRepository;
    private final UserRepository userRepository;

    public PlanService(PlanRepository planRepository, ExerciseRepository exerciseRepository, UserRepository userRepository) {
        this.planRepository = planRepository;
        this.exerciseRepository = exerciseRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public PlanResponse createPlan(PlanRequest req, Long trainerId) {
        if (req.getEndDate().isBefore(req.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        User trainer = userRepository.findById(trainerId)
                .orElseThrow(() -> new IllegalArgumentException("Trainer not found"));

        if (trainer.getRole() != Role.TRAINER) {
            throw new IllegalArgumentException("User is not a TRAINER");
        }

        Plan plan = new Plan();
        plan.setName(req.getName());
        plan.setStartDate(req.getStartDate());
        plan.setEndDate(req.getEndDate());
        plan.setTrainer(trainer);

        Plan savedPlan = planRepository.save(plan);
        return mapToPlanResponse(savedPlan);
    }

    @Transactional
    public ExerciseResponse addExercise(Long planId, ExerciseRequest req, Long trainerId) {
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found"));

        if (plan.getTrainer() == null || !plan.getTrainer().getId().equals(trainerId)) {
            throw new IllegalArgumentException("Access denied: Plan does not belong to trainer");
        }

        long totalDays = ChronoUnit.DAYS.between(plan.getStartDate(), plan.getEndDate()) + 1;
        if (req.getDayNumber() < 1 || req.getDayNumber() > totalDays) {
            throw new IllegalArgumentException("Day number " + req.getDayNumber() + " is outside plan duration (1-" + totalDays + ")");
        }

        Exercise exercise = new Exercise();
        exercise.setDayNumber(req.getDayNumber());
        exercise.setType(req.getType());
        exercise.setName(req.getName());
        exercise.setSets(req.getSets());
        exercise.setReps(req.getReps());
        exercise.setPlan(plan);

        Exercise savedExercise = exerciseRepository.save(exercise);
        return new ExerciseResponse(
                savedExercise.getId(),
                savedExercise.getDayNumber(),
                savedExercise.getType(),
                savedExercise.getName(),
                savedExercise.getSets(),
                savedExercise.getReps()
        );
    }

    @Transactional
    public PlanResponse assignClient(Long planId, Long clientId, Long trainerId) {
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found"));

        if (plan.getTrainer() == null || !plan.getTrainer().getId().equals(trainerId)) {
            throw new IllegalArgumentException("Access denied: Plan does not belong to trainer");
        }

        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("Client not found"));

        if (client.getRole() != Role.CLIENT) {
            throw new IllegalArgumentException("Target user is not a CLIENT");
        }

        // Overlap Check: Ensure client doesn't have an active plan in this date range
        List<Plan> overlappingPlans = planRepository.findOverlappingPlansForClient(clientId, plan.getStartDate(), plan.getEndDate());
        boolean hasConflict = overlappingPlans.stream().anyMatch(p -> !p.getId().equals(planId));
        if (hasConflict) {
            throw new IllegalArgumentException("Client already has an active plan assigned within this date range");
        }

        plan.setClient(client);
        Plan updatedPlan = planRepository.save(plan);
        return mapToPlanResponse(updatedPlan);
    }

    public Map<String, Object> getActivePlanForClient(Long clientId) {
        LocalDate today = LocalDate.now();
        Optional<Plan> activePlanOpt = planRepository.findByClientIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(clientId, today, today);

        Map<String, Object> response = new HashMap<>();
        if (activePlanOpt.isEmpty()) {
            response.put("message", "No active plan found for today");
            response.put("exercises", Collections.emptyList());
            return response;
        }

        Plan plan = activePlanOpt.get();
        int currentDayNumber = (int) ChronoUnit.DAYS.between(plan.getStartDate(), today) + 1;

        List<ExerciseResponse> todayExercises = plan.getExercises().stream()
                .filter(e -> e.getDayNumber() == currentDayNumber)
                .map(e -> new ExerciseResponse(e.getId(), e.getDayNumber(), e.getType(), e.getName(), e.getSets(), e.getReps()))
                .collect(Collectors.toList());

        response.put("id", plan.getId());
        response.put("name", plan.getName());
        response.put("startDate", plan.getStartDate());
        response.put("endDate", plan.getEndDate());
        response.put("currentDayNumber", currentDayNumber);
        response.put("exercises", todayExercises);

        return response;
    }

    public List<ClientResponse> getClientsForTrainer(Long trainerId) {
        List<User> clients = userRepository.findByRole(Role.CLIENT);
        return clients.stream()
                .map(c -> new ClientResponse(c.getId(), c.getName(), c.getEmail()))
                .collect(Collectors.toList());
    }

    private PlanResponse mapToPlanResponse(Plan plan) {
        List<ExerciseResponse> exerciseResponses = plan.getExercises() == null ? Collections.emptyList() :
                plan.getExercises().stream()
                        .map(e -> new ExerciseResponse(e.getId(), e.getDayNumber(), e.getType(), e.getName(), e.getSets(), e.getReps()))
                        .collect(Collectors.toList());

        String clientName = plan.getClient() != null ? plan.getClient().getName() : null;

        return new PlanResponse(
                plan.getId(),
                plan.getName(),
                plan.getStartDate(),
                plan.getEndDate(),
                clientName,
                exerciseResponses
        );
    }
}
