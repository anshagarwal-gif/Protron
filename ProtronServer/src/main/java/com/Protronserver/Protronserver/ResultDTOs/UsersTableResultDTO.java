package com.Protronserver.Protronserver.ResultDTOs;

import com.Protronserver.Protronserver.Entities.Role;
import com.Protronserver.Protronserver.Entities.UserAccessRights;

import java.util.List;

public class UsersTableResultDTO {

    private Long userId;
    private String name;
    private String email;
    private String mobilePhone;
    private String city;
    private String country;
    private String status;
    private String tenantName;
    private Role role;
    private List<UserAccessRights> userAccessRights;// full Role entity

    public UsersTableResultDTO(Long userId, String name, String email, String mobilePhone,
                                String city, String country, String status, String tenantName, Role role, List<UserAccessRights> userAccessRights) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.mobilePhone = mobilePhone;
        this.city = city;
        this.country = country;
        this.status = status;
        this.tenantName = tenantName;
        this.role = role;
        this.userAccessRights = userAccessRights;
    }

    // Getters and setters


    public List<UserAccessRights> getUserAccessRights() {
        return userAccessRights;
    }

    public void setUserAccessRights(List<UserAccessRights> userAccessRights) {
        this.userAccessRights = userAccessRights;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMobilePhone() { return mobilePhone; }
    public void setMobilePhone(String mobilePhone) { this.mobilePhone = mobilePhone; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTenantName() { return tenantName; }
    public void setTenantName(String tenantName) { this.tenantName = tenantName; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

}
