package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "po_consumption")
public class POConsumption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "utilization_id")
    private Long utilizationId;

    @Column(name = "po_number", nullable = false, length = 250)
    private String poNumber;

    @Column(name = "ms_name")
    private String msName;

    @Column(name = "amount")
    private Integer amount;

    @Column(name = "currency")
    private String currency;

    @Column(name = "utilization_type", length = 10)
    private String utilizationType;

    @Column(name = "resource_or_project")
    private String resourceOrProject;

    @Column(name = "work_desc")
    private String workDesc;

    @Temporal(TemporalType.DATE)
    @Column(name = "work_assigndate")
    private Date workAssignDate;

    @Temporal(TemporalType.DATE)
    @Column(name = "work_completiondate")
    private Date workCompletionDate;

    @Column(name = "remarks")
    private String remarks;

    @Column(name = "system_name")
    private String systemName;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_timestamp")
    private Date createdTimestamp;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "lastupdate_timestamp")
    private Date lastUpdateTimestamp;

    @Column(name = "updatedby")
    private String updatedBy;

    // Allowed utilization types
    private static final List<String> ALLOWED_TYPES = Arrays.asList("Fixed", "T&M", "Mixed");

    // ------------------ Getters and Setters ------------------

    public Long getUtilizationId() {
        return utilizationId;
    }

    public void setUtilizationId(Long utilizationId) {
        this.utilizationId = utilizationId;
    }

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
        if (!ALLOWED_TYPES.contains(utilizationType)) {
            throw new IllegalArgumentException("Invalid utilization type. Allowed values: Fixed, T&M, Mixed");
        }
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

    public Date getCreatedTimestamp() {
        return createdTimestamp;
    }

    public void setCreatedTimestamp(Date createdTimestamp) {
        this.createdTimestamp = createdTimestamp;
    }

    public Date getLastUpdateTimestamp() {
        return lastUpdateTimestamp;
    }

    public void setLastUpdateTimestamp(Date lastUpdateTimestamp) {
        this.lastUpdateTimestamp = lastUpdateTimestamp;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
