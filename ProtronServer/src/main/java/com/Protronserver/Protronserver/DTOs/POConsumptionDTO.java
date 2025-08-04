package com.Protronserver.Protronserver.DTOs;

import java.util.Date;

public class POConsumptionDTO {

    private String poNumber;
    private Long msId;
    private Integer amount;
    private String currency;
    private String utilizationType;
    private String resource;
    private String project;
    private String workDesc;
    private Date workAssignDate;
    private Date workCompletionDate;
    private String remarks;
    private String systemName;
    private String updatedBy;

    // Constructors
    public POConsumptionDTO() {
    }

    public POConsumptionDTO(String poNumber, Long msId , Integer amount, String currency,
            String utilizationType, String resource, String project, String workDesc,
            Date workAssignDate, Date workCompletionDate, String remarks,
            String systemName, String updatedBy) {
        this.poNumber = poNumber;
        this.msId = msId;
        this.amount = amount;
        this.currency = currency;
        this.utilizationType = utilizationType;
        this.resource = resource;
        this.project = project;
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

    public Long getMsId() {
        return msId;
    }

    public void setMsId(Long msId) {
        this.msId = msId;
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

    public String getResource() {
        return resource;
    }

    public void setResource(String resource) {
        this.resource = resource;
    }

    public String getProject() {
        return project;
    }

    public void setProject(String project) {
        this.project = project;
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