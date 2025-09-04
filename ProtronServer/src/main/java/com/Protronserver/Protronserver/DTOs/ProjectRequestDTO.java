package com.Protronserver.Protronserver.DTOs;

import jakarta.persistence.Column;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

public class ProjectRequestDTO {
    private String projectCode;
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

    private String productOwner;
    private String scrumMaster;
    private String architect;
    private String chiefScrumMaster;
    private String deliveryLeader;
    private String businessUnitFundedBy;
    private String businessUnitDeliveredTo;
    private Integer priority; // 1–10
    private BigDecimal businessValueAmount;
    private String businessValueType;

    public BigDecimal getBusinessValueAmount() {
        return businessValueAmount;
    }

    public void setBusinessValueAmount(BigDecimal businessValueAmount) {
        this.businessValueAmount = businessValueAmount;
    }

    public String getBusinessValueType() {
        return businessValueType;
    }

    public void setBusinessValueType(String businessValueType) {
        this.businessValueType = businessValueType;
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

    public String getProjectCode() {
        return projectCode;
    }

    public void setProjectCode(String projectCode) {
        this.projectCode = projectCode;
    }

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
