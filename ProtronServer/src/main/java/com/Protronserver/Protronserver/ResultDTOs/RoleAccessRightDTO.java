package com.Protronserver.Protronserver.ResultDTOs;

import com.Protronserver.Protronserver.Entities.AccessRight;

public class RoleAccessRightDTO {

    private Long roleAccessRightsId;
    private AccessRightDTO accessRight;

    public RoleAccessRightDTO(Long roleAccessRightsId, AccessRightDTO accessRight){
        this.accessRight =accessRight;
        this.roleAccessRightsId = roleAccessRightsId;
    }

    public Long getRoleAccessRightsId() {
        return roleAccessRightsId;
    }

    public void setRoleAccessRightsId(Long roleAccessRightsId) {
        this.roleAccessRightsId = roleAccessRightsId;
    }

    public AccessRightDTO getAccessRight() {
        return accessRight;
    }

    public void setAccessRight(AccessRightDTO accessRight) {
        this.accessRight = accessRight;
    }
}
