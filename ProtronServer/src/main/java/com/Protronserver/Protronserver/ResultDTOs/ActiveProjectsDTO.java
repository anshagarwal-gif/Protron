package com.Protronserver.Protronserver.ResultDTOs;

public class ActiveProjectsDTO {

    private Long projectId;
    private String projectName;

    public ActiveProjectsDTO(Long projectId, String projectName){
        this.projectId = projectId;
        this.projectName = projectName;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }
}
