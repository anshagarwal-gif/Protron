package com.Protronserver.Protronserver.DTO;

public class StatusFlagDTO {
    private Integer statusId;
    private Long tenantId;
    private String statusType;
    private String statusName;
    private String statusValue;
    private String remarks;

    // Default constructor
    public StatusFlagDTO() {
    }

    // Constructor with all fields
    public StatusFlagDTO(Integer statusId, Long tenantId, String statusType, String statusName, String statusValue,
            String remarks) {
        this.statusId = statusId;
        this.tenantId = tenantId;
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

    public Long getTenantId() {
        return tenantId;
    }

    public void setTenantId(Long tenantId) {
        this.tenantId = tenantId;
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
