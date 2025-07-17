package com.Protronserver.Protronserver.ResultDTOs;

import java.util.List;

public class RoleDTO {

    private Long roleId;
    private String roleName;
    private List<RoleAccessRightDTO> roleAccessRights;

    public RoleDTO(Long roleId, String roleName, List<RoleAccessRightDTO> roleAccessRights) {
        this.roleId = roleId;
        this.roleName = roleName;
        this.roleAccessRights = roleAccessRights;
    }

    public Long getRoleId() {
        return roleId;
    }

    public void setRoleId(Long roleId) {
        this.roleId = roleId;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public List<RoleAccessRightDTO> getRoleAccessRights() {
        return roleAccessRights;
    }

    public void setRoleAccessRights(List<RoleAccessRightDTO> roleAccessRights) {
        this.roleAccessRights = roleAccessRights;
    }
}
