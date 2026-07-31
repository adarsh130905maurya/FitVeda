package com.fitveda.controller;

import com.fitveda.dto.ExerciseRequest;
import com.fitveda.dto.ExerciseResponse;
import com.fitveda.dto.PlanRequest;
import com.fitveda.dto.PlanResponse;
import com.fitveda.dto.ClientResponse;
import com.fitveda.model.User;
import com.fitveda.repository.UserRepository;
import com.fitveda.service.PlanService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class PlanController {

    private final PlanService planService;
    private final UserRepository userRepository;

    public PlanController(PlanService planService, UserRepository userRepository) {
        this.planService = planService;
        this.userRepository = userRepository;
    }

    private Long getAuthenticatedUserId(Long fallbackId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            String email = auth.getName();
            return userRepository.findByEmail(email).map(User::getId).orElse(fallbackId);
        }
        return fallbackId;
    }

    @PostMapping("/plans")
    public ResponseEntity<PlanResponse> createPlan(
            @Valid @RequestBody PlanRequest request,
            @RequestParam(name = "trainerId", required = false, defaultValue = "1") Long trainerIdParam) {
        Long trainerId = getAuthenticatedUserId(trainerIdParam);
        PlanResponse response = planService.createPlan(request, trainerId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/plans/{planId}/exercises")
    public ResponseEntity<ExerciseResponse> addExercise(
            @PathVariable Long planId,
            @Valid @RequestBody ExerciseRequest request,
            @RequestParam(name = "trainerId", required = false, defaultValue = "1") Long trainerIdParam) {
        Long trainerId = getAuthenticatedUserId(trainerIdParam);
        ExerciseResponse response = planService.addExercise(planId, request, trainerId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/plans/{planId}/assign/{clientId}")
    public ResponseEntity<PlanResponse> assignClient(
            @PathVariable Long planId,
            @PathVariable Long clientId,
            @RequestParam(name = "trainerId", required = false, defaultValue = "1") Long trainerIdParam) {
        Long trainerId = getAuthenticatedUserId(trainerIdParam);
        PlanResponse response = planService.assignClient(planId, clientId, trainerId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/plans/my-plan")
    public ResponseEntity<Map<String, Object>> getMyPlan(
            @RequestParam(name = "clientId", required = false, defaultValue = "2") Long clientIdParam) {
        Long clientId = getAuthenticatedUserId(clientIdParam);
        Map<String, Object> response = planService.getActivePlanForClient(clientId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/clients")
    public ResponseEntity<List<ClientResponse>> getClients(
            @RequestParam(name = "trainerId", required = false, defaultValue = "1") Long trainerIdParam) {
        Long trainerId = getAuthenticatedUserId(trainerIdParam);
        List<ClientResponse> clients = planService.getClientsForTrainer(trainerId);
        return ResponseEntity.ok(clients);
    }
}
