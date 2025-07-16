package com.Protronserver.Protronserver.ResultDTOs;

public class SystemImpactedDTO {

    private Long systemId;
    private String systemName;
    private Long projectId;

    public SystemImpactedDTO(Long systemId, String systemName, Long projectId) {
        this.systemId = systemId;
        this.systemName = systemName;
        this.projectId = projectId;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public Long getSystemId() {
        return systemId;
    }

    public void setSystemId(Long systemId) {
        this.systemId = systemId;
    }

    public String getSystemName() {
        return systemName;
    }

    public void setSystemName(String systemName) {
        this.systemName = systemName;
    }
}
