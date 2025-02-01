package com.protron.Protron.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "timesheets")
public class Timesheet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long timesheetId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private int taskDuration; // Total duration of tasks in hours/minutes

    @Column(nullable = false)
    private String status; // Approved, Rejected, Pending

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @OneToMany(mappedBy = "timesheet", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Task> tasks;
}
