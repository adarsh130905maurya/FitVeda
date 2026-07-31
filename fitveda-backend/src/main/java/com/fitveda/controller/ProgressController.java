package com.fitveda.controller;

import com.fitveda.dto.ProgressRequest;
import com.fitveda.dto.ProgressSummaryResponse;
import com.fitveda.model.ProgressLog;
import com.fitveda.model.User;
import com.fitveda.repository.UserRepository;
import com.fitveda.service.ProgressService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class ProgressController {

    private final ProgressService progressService;
    private final UserRepository userRepository;

    public ProgressController(ProgressService progressService, UserRepository userRepository) {
        this.progressService = progressService;
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

    @PostMapping("/progress")
    public ResponseEntity<ProgressLog> logProgress(
            @Valid @RequestBody ProgressRequest request,
            @RequestParam(name = "clientId", required = false, defaultValue = "2") Long clientIdParam) {
        Long clientId = getAuthenticatedUserId(clientIdParam);
        ProgressLog log = progressService.logProgress(request, clientId);
        return ResponseEntity.ok(log);
    }

    @GetMapping("/clients/{clientId}/progress")
    public ResponseEntity<List<ProgressSummaryResponse>> getProgressSummary(
            @PathVariable Long clientId,
            @RequestParam(name = "trainerId", required = false, defaultValue = "1") Long trainerIdParam) {
        Long trainerId = getAuthenticatedUserId(trainerIdParam);
        List<ProgressSummaryResponse> summary = progressService.getProgressSummary(clientId, trainerId);
        return ResponseEntity.ok(summary);
    }
}
