package com.fitveda.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProgressSummaryResponse {
    private LocalDate date;
    private int totalExercises;
    private int completedCount;
    private int completionPercent;
}
