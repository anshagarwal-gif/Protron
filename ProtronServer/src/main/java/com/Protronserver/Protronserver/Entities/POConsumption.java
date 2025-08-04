package com.Protronserver.Protronserver.Entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "po_utilization")
public class POConsumption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "utilization_id")
    private Long utilizationId;

    @Column(name = "po_number", nullable = false, length = 250)
    private String poNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ms_id", referencedColumnName = "ms_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "poDetail" })
    private POMilestone milestone;

    @Column(name = "amount")
    private Integer amount;

    @Column(name = "currency")
    private String currency;

    @Column(name = "utilization_type", length = 10)
    private String utilizationType;

    @Column(name = "resource")
    private String resource;

    @Column(name = "project")
    private String project;

    @Column(name = "work_desc")
    private String workDesc;

    @Column(name = "work_assigndate")
    private Date workAssignDate;

    @Column(name = "work_completiondate")
    private Date workCompletionDate;

    @Column(name = "remarks")
    private String remarks;

    @Column(name = "system_name")
    private String systemName;

    @Column(name = "created_timestamp")
    private LocalDateTime createdTimestamp;

    @Column(name = "lastupdate_timestamp")
    private LocalDateTime lastUpdateTimestamp;

    @Column(name = "updatedby")
    private String updatedBy;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    // Allowed utilization types
    private static final List<String> ALLOWED_TYPES = Arrays.asList("Fixed", "T&M", "Mixed");

    // ------------------ Getters and Setters ------------------


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

    public Long getTenantId() {
        return tenantId;
    }

    public void setTenantId(Long tenantId) {
        this.tenantId = tenantId;
    }

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

    public POMilestone getMilestone() {
        return milestone;
    }

    public void setMilestone(POMilestone milestone) {
        this.milestone = milestone;
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

    public LocalDateTime getCreatedTimestamp() {
        return createdTimestamp;
    }

    public void setCreatedTimestamp(LocalDateTime createdTimestamp) {
        this.createdTimestamp = createdTimestamp;
    }

    public LocalDateTime getLastUpdateTimestamp() {
        return lastUpdateTimestamp;
    }

    public void setLastUpdateTimestamp(LocalDateTime lastUpdateTimestamp) {
        this.lastUpdateTimestamp = lastUpdateTimestamp;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
