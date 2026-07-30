package com.fitveda.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "exercises")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    public int dayNumber;

    @Enumerated(EnumType.STRING)
    public ExerciseType type;

    @NotBlank
    public String name;

    public int sets;

    @NotBlank
    public String reps;

    @ManyToOne
    @JoinColumn(name = "plan_id")
    public Plan plan;
}
