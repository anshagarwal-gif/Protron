package com.Protronserver.Protronserver.ResultDTOs;

public class UserBasicDetailDTO {
    private String email;
    private String phoneNumber;
    private String roleName;
    private String tenantName;
    private String fullName;
    private String empCode;

    public UserBasicDetailDTO(String email, String phoneNumber, String roleName, String tenantName, String fullName, String empCode) {
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.roleName = roleName;
        this.tenantName = tenantName;
        this.fullName = fullName;
        this.empCode = empCode;
    }

    // Getters and Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }

    public String getTenantName() { return tenantName; }
    public void setTenantName(String tenantName) { this.tenantName = tenantName; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmpCode() {
        return empCode;
    }

    public void setEmpCode(String empCode) {
        this.empCode = empCode;
    }
}
