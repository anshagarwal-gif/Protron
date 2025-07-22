package com.Protronserver.Protronserver.DTOs;

import java.util.Date;

public class POConsumptionDTO {

    private String poNumber;
    private String msName;
    private Integer amount;
    private String currency;
    private String utilizationType;
    private String resourceOrProject;
    private String workDesc;
    private Date workAssignDate;
    private Date workCompletionDate;
    private String remarks;
    private String systemName;
    private String updatedBy;

    // Constructors
    public POConsumptionDTO() {
    }

    public POConsumptionDTO(String poNumber, String msName, Integer amount, String currency,
            String utilizationType, String resourceOrProject, String workDesc,
            Date workAssignDate, Date workCompletionDate, String remarks,
            String systemName, String updatedBy) {
        this.poNumber = poNumber;
        this.msName = msName;
        this.amount = amount;
        this.currency = currency;
        this.utilizationType = utilizationType;
        this.resourceOrProject = resourceOrProject;
        this.workDesc = workDesc;
        this.workAssignDate = workAssignDate;
        this.workCompletionDate = workCompletionDate;
        this.remarks = remarks;
        this.systemName = systemName;
        this.updatedBy = updatedBy;
    }

    // Getters and Setters
    public String getPoNumber() {
        return poNumber;
    }

    public void setPoNumber(String poNumber) {
        this.poNumber = poNumber;
    }

    public String getMsName() {
        return msName;
    }

    public void setMsName(String msName) {
        this.msName = msName;
    }

    public Integer getAmount() {
        return amount;
    }

    public void setAmount(Integer amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getUtilizationType() {
        return utilizationType;
    }

    public void setUtilizationType(String utilizationType) {
        this.utilizationType = utilizationType;
    }

    public String getResourceOrProject() {
        return resourceOrProject;
    }

    public void setResourceOrProject(String resourceOrProject) {
        this.resourceOrProject = resourceOrProject;
    }

    public String getWorkDesc() {
        return workDesc;
    }

    public void setWorkDesc(String workDesc) {
        this.workDesc = workDesc;
    }

    public Date getWorkAssignDate() {
        return workAssignDate;
    }

    public void setWorkAssignDate(Date workAssignDate) {
        this.workAssignDate = workAssignDate;
    }

    public Date getWorkCompletionDate() {
        return workCompletionDate;
    }

    public void setWorkCompletionDate(Date workCompletionDate) {
        this.workCompletionDate = workCompletionDate;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getSystemName() {
        return systemName;
    }

    public void setSystemName(String systemName) {
        this.systemName = systemName;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}