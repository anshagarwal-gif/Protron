package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;

@Entity
@Table(name = "status_flags")
public class StatusFlag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "status_id", nullable = false, updatable = false)
    private Integer statusId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant; // Assuming Tenant entity exists

    @Column(name = "status_type", length = 50)
    private String statusType;

    @Column(name = "status_name", length = 50)
    private String statusName;

    @Column(name = "status_value", length = 50)
    private String statusValue;

    @Column(name = "remarks", length = 250)
    private String remarks;

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
}
