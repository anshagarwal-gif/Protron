package com.Protronserver.Protronserver.ResultDTOs;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class ProjectDetailsDTO {
    private Long projectId;
    private String projectName;
    private String tenantName;
    private Date startDate;
    private Date endDate;
    private String unit;
    private Double projectCost;
    private LocalDateTime createdDate;

    private String status;
    private int durationInDays;

    private Long managerId;
    private String managerName;
    private String managerEmpCode;

    private Long sponsorId;
    private String sponsorName;
    private String sponsorEmpCode;

    private String projectIcon;

    public ProjectDetailsDTO(Long projectId, String projectName, String tenantName,
                             Date startDate, Date endDate, String unit, Double projectCost,
                             LocalDateTime createdDate, String projectIcon,
                             Long managerId, String managerName, String managerEmpCode,
                             Long sponsorId, String sponsorName, String sponsorEmpCode) {
        this.projectId = projectId;
        this.projectName = projectName;
        this.tenantName = tenantName;
        this.startDate = startDate;
        this.endDate = endDate;
        this.unit = unit;
        this.projectCost = projectCost;
        this.createdDate = createdDate;
        this.projectIcon = projectIcon;
        this.managerId = managerId;
        this.managerName = managerName;
        this.managerEmpCode = managerEmpCode;
        this.sponsorId = sponsorId;
        this.sponsorName = sponsorName;
        this.sponsorEmpCode = sponsorEmpCode;
    }

    public Long getManagerId() {
        return managerId;
    }

    public void setManagerId(Long managerId) {
        this.managerId = managerId;
    }

    public Long getSponsorId() {
        return sponsorId;
    }

    public void setSponsorId(Long sponsorId) {
        this.sponsorId = sponsorId;
    }

    public String getProjectIcon() {
        return projectIcon;
    }

    public void setProjectIcon(String projectIcon) {
        this.projectIcon = projectIcon;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public String getTenantName() {
        return tenantName;
    }

    public void setTenantName(String tenantName) {
        this.tenantName = tenantName;
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

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Double getProjectCost() {
        return projectCost;
    }

    public void setProjectCost(Double projectCost) {
        this.projectCost = projectCost;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getDurationInDays() {
        return durationInDays;
    }

    public void setDurationInDays(int durationInDays) {
        this.durationInDays = durationInDays;
    }

    public String getManagerName() {
        return managerName;
    }

    public void setManagerName(String managerName) {
        this.managerName = managerName;
    }

    public String getManagerEmpCode() {
        return managerEmpCode;
    }

    public void setManagerEmpCode(String managerEmpCode) {
        this.managerEmpCode = managerEmpCode;
    }

    public String getSponsorName() {
        return sponsorName;
    }

    public void setSponsorName(String sponsorName) {
        this.sponsorName = sponsorName;
    }

    public String getSponsorEmpCode() {
        return sponsorEmpCode;
    }

    public void setSponsorEmpCode(String sponsorEmpCode) {
        this.sponsorEmpCode = sponsorEmpCode;
    }


    // All setters and getters
}

