package com.Protronserver.Protronserver.ResultDTOs;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class ProjectDetailsDTO {
    private String projectCode;
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

    private String productOwner;
    private String scrumMaster;
    private String architect;
    private String chiefScrumMaster;
    private String deliveryLeader;
    private String businessUnitFundedBy;
    private String businessUnitDeliveredTo;
    private Integer priority;

    public ProjectDetailsDTO(String projectCode, Long projectId, String projectName, String tenantName,
                             Date startDate, Date endDate, String unit, Double projectCost,
                             LocalDateTime createdDate, String projectIcon,
                             Long managerId, String managerName, String managerEmpCode,
                             Long sponsorId, String sponsorName, String sponsorEmpCode,
                             String productOwner, String scrumMaster, String architect, String chiefScrumMaster,
                             String deliveryLeader, String businessUnitFundedBy, String businessUnitDeliveredTo, Integer priority) {
        this.projectCode = projectCode;
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
        this.productOwner = productOwner;
        this.scrumMaster = scrumMaster;
        this.architect = architect;
        this.chiefScrumMaster = chiefScrumMaster;
        this.deliveryLeader = deliveryLeader;
        this.businessUnitFundedBy = businessUnitFundedBy;
        this.businessUnitDeliveredTo = businessUnitDeliveredTo;
        this.priority = priority;
    }

    public String getProjectCode() {
        return projectCode;
    }

    public void setProjectCode(String projectCode) {
        this.projectCode = projectCode;
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

    public String getProductOwner() {
        return productOwner;
    }

    public void setProductOwner(String productOwner) {
        this.productOwner = productOwner;
    }

    public String getScrumMaster() {
        return scrumMaster;
    }

    public void setScrumMaster(String scrumMaster) {
        this.scrumMaster = scrumMaster;
    }

    public String getArchitect() {
        return architect;
    }

    public void setArchitect(String architect) {
        this.architect = architect;
    }

    public String getChiefScrumMaster() {
        return chiefScrumMaster;
    }

    public void setChiefScrumMaster(String chiefScrumMaster) {
        this.chiefScrumMaster = chiefScrumMaster;
    }

    public String getDeliveryLeader() {
        return deliveryLeader;
    }

    public void setDeliveryLeader(String deliveryLeader) {
        this.deliveryLeader = deliveryLeader;
    }

    public String getBusinessUnitFundedBy() {
        return businessUnitFundedBy;
    }

    public void setBusinessUnitFundedBy(String businessUnitFundedBy) {
        this.businessUnitFundedBy = businessUnitFundedBy;
    }

    public String getBusinessUnitDeliveredTo() {
        return businessUnitDeliveredTo;
    }

    public void setBusinessUnitDeliveredTo(String businessUnitDeliveredTo) {
        this.businessUnitDeliveredTo = businessUnitDeliveredTo;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    // All setters and getters
}

