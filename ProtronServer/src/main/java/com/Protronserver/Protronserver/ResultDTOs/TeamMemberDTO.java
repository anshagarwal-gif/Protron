package com.Protronserver.Protronserver.ResultDTOs;

public class TeamMemberDTO {

    private Long userId;
    private String fullName;
    private String empCode;
    private Long projectId;

    public TeamMemberDTO(Long userId, String fullName, String empCode, Long projectId) {
        this.userId = userId;
        this.fullName = fullName;
        this.empCode = empCode;
        this.projectId = projectId;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmpCode() {
        return empCode;
    }

    public void setEmpCode(String empCode) {
        this.empCode = empCode;
    }
}
