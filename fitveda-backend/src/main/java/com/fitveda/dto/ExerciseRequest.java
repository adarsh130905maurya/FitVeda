package com.fitveda.dto;

import com.fitveda.model.ExerciseType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseRequest {

    @Min(value = 1, message = "Day number must be at least 1")
    private int dayNumber;

    @NotNull(message = "Exercise type is required")
    private ExerciseType type;

    @NotBlank(message = "Exercise name is required")
    private String name;

    @Min(value = 1, message = "Sets must be at least 1")
    private int sets;

    @NotBlank(message = "Reps description is required")
    private String reps;
}
