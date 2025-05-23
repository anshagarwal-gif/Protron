package com.Protronserver.Protronserver.DTOs;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

public class ProjectRequestDTO {
    private String projectName;
    private String projectIcon;
    private Date startDate;
    private Date endDate;
    private String unit;
    private Double projectCost;
    private Long projectManagerId;
    private Long tenent;
    private List<TeamMemberRequestDTO> projectTeam;
    private List<String> systemImpacted;
    // Added timestamp fields
    private LocalDateTime startTimestamp;
    private LocalDateTime endTimestamp;

    // Added last updated by field
    private String lastUpdatedBy;
    private Long sponsor;

    public List<String> getSystemImpacted() {
        return systemImpacted;
    }

    public void setSystemImpacted(List<String> systemImpacted) {
        this.systemImpacted = systemImpacted;
    }

    public Long getSponsor() {
        return sponsor;
    }

    public void setSponsor(Long sponsor) {
        this.sponsor = sponsor;
    }

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

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public void setLastUpdatedBy(String lastUpdatedBy) {
        this.lastUpdatedBy = lastUpdatedBy;
    }

    public List<TeamMemberRequestDTO> getProjectTeam() {
        return projectTeam;
    }

    public void setProjectTeam(List<TeamMemberRequestDTO> projectTeam) {
        this.projectTeam = projectTeam;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public Long getTenent() {
        return tenent;
    }

    public void setTenent(Long tenent) {
        this.tenent = tenent;
    }

    public String getProjectIcon() {
        return projectIcon;
    }

    public void setProjectIcon(String projectIcon) {
        this.projectIcon = projectIcon;
    }

    public Date getStartDate() {
        return startDate;
    }

    public void setStartDate(Date startDate) {
        this.startDate = startDate;
    }

    public Date getEndDate() {
        return endDate;
    }

    public void setEndDate(Date endDate) {
        this.endDate = endDate;
    }

    public Double getProjectCost() {
        return projectCost;
    }

    public void setProjectCost(Double projectCost) {
        this.projectCost = projectCost;
    }

    public Long getProjectManagerId() {
        return projectManagerId;
    }

    public void setProjectManagerId(Long projectManagerId) {
        this.projectManagerId = projectManagerId;
    }
}
