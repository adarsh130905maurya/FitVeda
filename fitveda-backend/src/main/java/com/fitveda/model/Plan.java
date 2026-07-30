package com.fitveda.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @NotBlank
    public String name;

    public LocalDate startDate;

    public LocalDate endDate;

    @ManyToOne
    @JoinColumn(name = "trainer_id")
    public User trainer;

    @ManyToOne
    @JoinColumn(name = "client_id")
    public User client;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<Exercise> exercises = new ArrayList<>();
}
