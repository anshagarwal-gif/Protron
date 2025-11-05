package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "task")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", length = 15, unique = true)
    private String taskId;

    @Column(name = "tenant_id", length = 15)
    private Long tenantId;

    @Column(name = "project_id", length = 15)
    private Long projectId;

    @Column(name = "parent_id", length = 15)
    private String parentId;

    @Column(name = "date")
    private LocalDate date;

    @Column(length = 100)
    private String status;

    @Column(length = 50)
    private String taskType;

    @Column(length = 150)
    private String taskTopic;

    @Column(length = 500)
    private String taskDescription;

    @Column(length = 50)
    private String estTime;

    @Column(length = 2)
    private int timeSpentHours;

    @Column(length = 2)
    private int timeSpentMinutes;

    @Column(length = 2)
    private int timeRemainingHours;

    @Column(length = 2)
    private int timeRemainingMinutes;

    private String createdBy;
    private LocalDateTime dateCreated;

    // Fields for versioning and soft delete
    @Column(nullable = false)
    private LocalDateTime startTimestamp;
    private LocalDateTime endTimestamp;
    private String lastUpdatedBy;

    // Getters and setters


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTaskId() {
        return taskId;
    }

    public void setTaskId(String taskId) {
        this.taskId = taskId;
    }

    public Long getTenantId() {
        return tenantId;
    }

    public void setTenantId(Long tenantId) {
        this.tenantId = tenantId;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getParentId() {
        return parentId;
    }

    public void setParentId(String parentId) {
        this.parentId = parentId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getTaskType() {
        return taskType;
    }

    public void setTaskType(String taskType) {
        this.taskType = taskType;
    }

    public String getTaskTopic() {
        return taskTopic;
    }

    public void setTaskTopic(String taskTopic) {
        this.taskTopic = taskTopic;
    }

    public String getTaskDescription() {
        return taskDescription;
    }

    public void setTaskDescription(String taskDescription) {
        this.taskDescription = taskDescription;
    }

    public String getEstTime() {
        return estTime;
    }

    public void setEstTime(String estTime) {
        this.estTime = estTime;
    }

    public int getTimeSpentHours() {
        return timeSpentHours;
    }

    public void setTimeSpentHours(int timeSpentHours) {
        this.timeSpentHours = timeSpentHours;
    }

    public int getTimeSpentMinutes() {
        return timeSpentMinutes;
    }

    public void setTimeSpentMinutes(int timeSpentMinutes) {
        this.timeSpentMinutes = timeSpentMinutes;
    }

    public int getTimeRemainingHours() {
        return timeRemainingHours;
    }

    public void setTimeRemainingHours(int timeRemainingHours) {
        this.timeRemainingHours = timeRemainingHours;
    }

    public int getTimeRemainingMinutes() {
        return timeRemainingMinutes;
    }

    public void setTimeRemainingMinutes(int timeRemainingMinutes) {
        this.timeRemainingMinutes = timeRemainingMinutes;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getDateCreated() {
        return dateCreated;
    }

    public void setDateCreated(LocalDateTime dateCreated) {
        this.dateCreated = dateCreated;
    }

    public LocalDateTime getStartTimestamp() {
        return startTimestamp;
    }

    public void setStartTimestamp(LocalDateTime startTimestamp) {
        this.startTimestamp = startTimestamp;
    }

    public LocalDateTime getEndTimestamp() {
        return endTimestamp;
    }

    public void setEndTimestamp(LocalDateTime endTimestamp) {
        this.endTimestamp = endTimestamp;
    }

    public String getLastUpdatedBy() {
        return lastUpdatedBy;
    }

    public void setLastUpdatedBy(String lastUpdatedBy) {
        this.lastUpdatedBy = lastUpdatedBy;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
