package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;

@Entity
@Table(name = "task_attachment")

public class TaskAttachment {
      @Id
    @Column(name = "task_id", length = 15)
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

}
