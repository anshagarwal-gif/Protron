package com.Protronserver.Protronserver.ResultDTOs;

import com.Protronserver.Protronserver.Entities.Role;
import com.Protronserver.Protronserver.Entities.UserAccessRights;

import java.util.List;

public class UserRoleAccessDTO {

    private Long userId;
    private RoleDTO role;
    private List<UserAccessRightDTO> userAccessRights;

    public UserRoleAccessDTO(Long userId, RoleDTO role, List<UserAccessRightDTO> userAccessRights) {
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

    public RoleDTO getRole() {
        return role;
    }

    public void setRole(RoleDTO role) {
        this.role = role;
    }

    public List<UserAccessRightDTO> getUserAccessRights() {
        return userAccessRights;
    }

    public void setUserAccessRights(List<UserAccessRightDTO> userAccessRights) {
        this.userAccessRights = userAccessRights;
    }
}
