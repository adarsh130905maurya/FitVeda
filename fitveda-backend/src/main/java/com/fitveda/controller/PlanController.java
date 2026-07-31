package com.fitveda.controller;

import com.fitveda.dto.ExerciseRequest;
import com.fitveda.dto.ExerciseResponse;
import com.fitveda.dto.PlanRequest;
import com.fitveda.dto.PlanResponse;
import com.fitveda.dto.ClientResponse;
import com.fitveda.service.PlanService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class PlanController {

    private final PlanService planService;

    public PlanController(PlanService planService) {
        this.planService = planService;
    }

    @PostMapping("/plans")
    public ResponseEntity<PlanResponse> createPlan(
            @Valid @RequestBody PlanRequest request,
            @RequestParam(name = "trainerId", defaultValue = "1") Long trainerId) {
        PlanResponse response = planService.createPlan(request, trainerId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/plans/{planId}/exercises")
    public ResponseEntity<ExerciseResponse> addExercise(
            @PathVariable Long planId,
            @Valid @RequestBody ExerciseRequest request,
            @RequestParam(name = "trainerId", defaultValue = "1") Long trainerId) {
        ExerciseResponse response = planService.addExercise(planId, request, trainerId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/plans/{planId}/assign/{clientId}")
    public ResponseEntity<PlanResponse> assignClient(
            @PathVariable Long planId,
            @PathVariable Long clientId,
            @RequestParam(name = "trainerId", defaultValue = "1") Long trainerId) {
        PlanResponse response = planService.assignClient(planId, clientId, trainerId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/plans/my-plan")
    public ResponseEntity<Map<String, Object>> getMyPlan(
            @RequestParam(name = "clientId", defaultValue = "2") Long clientId) {
        Map<String, Object> response = planService.getActivePlanForClient(clientId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/clients")
    public ResponseEntity<List<ClientResponse>> getClients(
            @RequestParam(name = "trainerId", defaultValue = "1") Long trainerId) {
        List<ClientResponse> clients = planService.getClientsForTrainer(trainerId);
        return ResponseEntity.ok(clients);
    }
}
