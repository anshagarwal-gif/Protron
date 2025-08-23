package com.Protronserver.Protronserver.DTOs;

public class SystemMasterDTO {
    private Integer systemId;
    private String systemName;
    private String systemDesc;
    private Long tenantId;

    // Default constructor
    public SystemMasterDTO() {
    }

    // Constructor with parameters
    public SystemMasterDTO(Integer systemId, String systemName, String systemDesc, Long tenantId) {
        this.systemId = systemId;
        this.systemName = systemName;
        this.systemDesc = systemDesc;
        this.tenantId = tenantId;
    }

    // Getters and Setters
    public Integer getSystemId() {
        return systemId;
    }

    public void setSystemId(Integer systemId) {
        this.systemId = systemId;
    }

    public String getSystemName() {
        return systemName;
    }

    public void setSystemName(String systemName) {
        this.systemName = systemName;
    }

    public String getSystemDesc() {
        return systemDesc;
    }

    public void setSystemDesc(String systemDesc) {
        this.systemDesc = systemDesc;
    }

    public Long getTenantId() {
        return tenantId;
    }

    public void setTenantId(Long tenantId) {
        this.tenantId = tenantId;
    }
}
