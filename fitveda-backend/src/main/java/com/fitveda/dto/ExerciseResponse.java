package com.fitveda.dto;

import com.fitveda.model.ExerciseType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseResponse {
    private Long id;
    private int dayNumber;
    private ExerciseType type;
    private String name;
    private int sets;
    private String reps;
}
