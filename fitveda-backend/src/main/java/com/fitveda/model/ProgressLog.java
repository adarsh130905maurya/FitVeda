package com.fitveda.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(
    name = "progress_logs",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_progress_client_exercise_date",
        columnNames = {"client_id", "exercise_id", "date"}
    )
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProgressLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    public LocalDate date;

    @Enumerated(EnumType.STRING)
    public LogStatus status;

    public String notes;

    @ManyToOne
    @JoinColumn(name = "client_id")
    public User client;

    @ManyToOne
    @JoinColumn(name = "exercise_id")
    public Exercise exercise;
}
