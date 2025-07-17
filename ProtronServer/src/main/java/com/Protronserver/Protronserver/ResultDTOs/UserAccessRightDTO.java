package com.Protronserver.Protronserver.ResultDTOs;

public class UserAccessRightDTO {

    private Long userAccessRightId;
    private Long accessId;
    private String moduleName;
    private boolean canView;
    private boolean canEdit;
    private boolean canDelete;

    public UserAccessRightDTO(Long id, Long accessId, String moduleName,
                              boolean canView, boolean canEdit, boolean canDelete) {
        this.userAccessRightId = id;
        this.accessId = accessId;
        this.moduleName = moduleName;
        this.canView = canView;
        this.canEdit = canEdit;
        this.canDelete = canDelete;
    }

    public Long getUserAccessRightId() {
        return userAccessRightId;
    }

    public void setUserAccessRightId(Long userAccessRightId) {
        this.userAccessRightId = userAccessRightId;
    }

    public Long getAccessId() {
        return accessId;
    }

    public void setAccessId(Long accessId) {
        this.accessId = accessId;
    }

    public String getModuleName() {
        return moduleName;
    }

    public void setModuleName(String moduleName) {
        this.moduleName = moduleName;
    }

    public boolean isCanView() {
        return canView;
    }

    public void setCanView(boolean canView) {
        this.canView = canView;
    }

    public boolean isCanEdit() {
        return canEdit;
    }

    public void setCanEdit(boolean canEdit) {
        this.canEdit = canEdit;
    }

    public boolean isCanDelete() {
        return canDelete;
    }

    public void setCanDelete(boolean canDelete) {
        this.canDelete = canDelete;
    }
}
