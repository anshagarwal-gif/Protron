package com.Protronserver.Protronserver.Entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

@Entity
@Table(name = "status_flags")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class StatusFlag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "statusid")
    private Integer statusId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tenant_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    @JsonManagedReference
    private Tenant tenant;

    @Column(name = "status_type")
    private String statusType;

    @Column(name = "status_name")
    private String statusName;

    @Column(name = "status_value")
    private String statusValue;

    @Column(name = "remarks")
    private String remarks;

    // Default constructor
    public StatusFlag() {
    }

    // Constructor with all fields
    public StatusFlag(Tenant tenant, String statusType, String statusName, String statusValue, String remarks) {
        this.tenant = tenant;
        this.statusType = statusType;
        this.statusName = statusName;
        this.statusValue = statusValue;
        this.remarks = remarks;
    }

    // Getters and Setters
    public Integer getStatusId() {
        return statusId;
    }

    public void setStatusId(Integer statusId) {
        this.statusId = statusId;
    }

    public Tenant getTenant() {
        return tenant;
    }

    public void setTenant(Tenant tenant) {
        this.tenant = tenant;
    }

    // Safe getter for tenant ID to avoid lazy loading issues
    public Long getTenantId() {
        return tenant != null ? tenant.getTenantId() : null;
    }

    public String getStatusType() {
        return statusType;
    }

    public void setStatusType(String statusType) {
        this.statusType = statusType;
    }

    public String getStatusName() {
        return statusName;
    }

    public void setStatusName(String statusName) {
        this.statusName = statusName;
    }

    public String getStatusValue() {
        return statusValue;
    }

    public void setStatusValue(String statusValue) {
        this.statusValue = statusValue;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    @Override
    public String toString() {
        return "StatusFlag{" +
                "statusId=" + statusId +
                ", tenant=" + (tenant != null ? tenant.getTenantId() : "null") +
                ", statusType='" + statusType + '\'' +
                ", statusName='" + statusName + '\'' +
                ", statusValue='" + statusValue + '\'' +
                ", remarks='" + remarks + '\'' +
                '}';
    }
}