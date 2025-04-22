package com.Protronserver.Protronserver.Entities;

import com.fasterxml.jackson.annotation.*;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

//@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "projectTeamId")
@Getter
@Setter
@Entity
@Table(name = "project_team")
public class ProjectTeam {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long projectTeamId;
    private Double pricing;
    private String empCode;
    private String status;
    private String taskType;
    private String unit;
    // Added timestamp fields
    private LocalDateTime startTimestamp;
    private LocalDateTime endTimestamp;

    // Added last updated by field
    private String lastUpdatedBy;

    // Getters and setters for the new fields
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

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate estimatedReleaseDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id", nullable = false)
    @JsonIgnoreProperties({ "team", "projectManager" })
    private Project project;

    public LocalDate getEstimatedReleaseDate() {
        return estimatedReleaseDate;
    }

    public void setEstimatedReleaseDate(LocalDate estimatedReleaseDate) {
        this.estimatedReleaseDate = estimatedReleaseDate;
    }

    public String getTaskType() {
        return taskType;
    }

    public void setTaskType(String taskType) {
        this.taskType = taskType;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Long getProjectTeamId() {
        return projectTeamId;
    }

    public Double getPricing() {
        return pricing;
    }

    public String getEmpCode() {
        return empCode;
    }

    public String getStatus() {
        return status;
    }

    public Project getProject() {
        return project;
    }

    public User getUser() {
        return user;
    }

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({ "projectTeams", "projectsManaged" })
    private User user;

    public void setProjectTeamId(Long projectTeamId) {
        this.projectTeamId = projectTeamId;
    }

    public void setPricing(Double pricing) {
        this.pricing = pricing;
    }

    public void setEmpCode(String empCode) {
        this.empCode = empCode;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
