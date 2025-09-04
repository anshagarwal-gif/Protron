package com.Protronserver.Protronserver.DTOs;

import com.Protronserver.Protronserver.Entities.Systemimpacted;
import jakarta.persistence.Column;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

@Getter
@Setter
public class ProjectUpdateDTO {

    private String projectName;
    private String projectIcon;
    private Date startDate;
    private Date endDate;
    private Double projectCost;
    private Long projectManagerId;
    private Long sponsorId;
    private String unit;
    private List<SystemImpactedDTO> systemImpacted;
    private List<Long> removedSystems;
    private String productOwner;
    private String scrumMaster;
    private String architect;
    private String chiefScrumMaster;
    private String deliveryLeader;
    private String businessUnitFundedBy;
    private String businessUnitDeliveredTo;
    private Integer priority;
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

    public List<Long> getRemovedSystems() {
        return removedSystems;
    }

    public void setRemovedSystems(List<Long> removedSystems) {
        this.removedSystems = removedSystems;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
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

    public Long getSponsorId() {
        return sponsorId;
    }

    public void setSponsorId(Long sponsorId) {
        this.sponsorId = sponsorId;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public List<SystemImpactedDTO> getSystemImpacted() {
        return systemImpacted;
    }

    public void setSystemImpacted(List<SystemImpactedDTO> systemImpacted) {
        this.systemImpacted = systemImpacted;
    }
}
