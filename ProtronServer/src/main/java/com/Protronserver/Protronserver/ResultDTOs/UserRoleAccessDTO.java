package com.Protronserver.Protronserver.ResultDTOs;

import com.Protronserver.Protronserver.Entities.Role;
import com.Protronserver.Protronserver.Entities.UserAccessRights;

import java.util.List;

public class UserRoleAccessDTO {

    private Long userId;
    private Role role;
    private List<UserAccessRights> userAccessRights;

    public UserRoleAccessDTO(Long userId, Role role, List<UserAccessRights> userAccessRights) {
        this.userId = userId;
        this.role = role;
        this.userAccessRights = userAccessRights;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public List<UserAccessRights> getUserAccessRights() {
        return userAccessRights;
    }

    public void setUserAccessRights(List<UserAccessRights> userAccessRights) {
        this.userAccessRights = userAccessRights;
    }
}
