package com.fitveda.controller;

import com.fitveda.dto.ProgressRequest;
import com.fitveda.dto.ProgressSummaryResponse;
import com.fitveda.model.ProgressLog;
import com.fitveda.service.ProgressService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @PostMapping("/progress")
    public ResponseEntity<ProgressLog> logProgress(
            @Valid @RequestBody ProgressRequest request,
            @RequestParam(name = "clientId", defaultValue = "2") Long clientId) {
        ProgressLog log = progressService.logProgress(request, clientId);
        return ResponseEntity.ok(log);
    }

    @GetMapping("/clients/{clientId}/progress")
    public ResponseEntity<List<ProgressSummaryResponse>> getProgressSummary(
            @PathVariable Long clientId,
            @RequestParam(name = "trainerId", defaultValue = "1") Long trainerId) {
        List<ProgressSummaryResponse> summary = progressService.getProgressSummary(clientId, trainerId);
        return ResponseEntity.ok(summary);
    }
}
