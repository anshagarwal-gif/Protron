package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "task")

public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", length = 15, unique = true)
    @Pattern(regexp = "T-\\d{6}", message = "Task ID must be in the format 'T-000012'")
    private String taskId;

    @Column(name = "tenant_id", length = 15)
    private String tenantId;

    @Column(name = "project_id", length = 15)
    private String projectId;

    @Column(name = "story_id", length = 15)
    private String storyId;

    @Column(length = 50)
    private String taskType;

    @Column(length = 150)
    private String taskTopic;

    @Column(length = 500)
    private String taskDescription;

    @Column(length = 50)
    private String estTime;

    @Column(length = 50)
    private String timeSpent;

    @Column(length = 50)
    private String timeRemaining;

    // Getters and setters
}
