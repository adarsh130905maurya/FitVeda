package com.fitveda.dto;

import com.fitveda.model.LogStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProgressRequest {

    @NotNull(message = "Exercise ID is required")
    private Long exerciseId;

    @NotNull(message = "Status is required")
    private LogStatus status;

    private String notes;
}
