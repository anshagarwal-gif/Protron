package com.Protronserver.Protronserver.ResultDTOs;

public class UserAccessRightDTO {

    private Long userAccessRightId;
    private AccessRightDTO accessRight;

    public UserAccessRightDTO(Long id, AccessRightDTO accessRight) {
        this.userAccessRightId = id;
        this.accessRight = accessRight;
    }

    public Long getUserAccessRightId() {
        return userAccessRightId;
    }

    public void setUserAccessRightId(Long userAccessRightId) {
        this.userAccessRightId = userAccessRightId;
    }

    public AccessRightDTO getAccessRight() {
        return accessRight;
    }

    public void setAccessRight(AccessRightDTO accessRight) {
        this.accessRight = accessRight;
    }
}
