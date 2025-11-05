package com.Protronserver.Protronserver.ResultDTOs;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class TaskDto {
    private Long projectId;
    private String parentId;
    private LocalDate date;
    private String taskType;
    private String taskTopic;
    private String taskDescription;
    private String estTime;
    private String status;
    private int timeSpentHours;
    private int timeSpentMinutes;
    private int timeRemainingHours;
    private int timeRemainingMinutes;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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
}
