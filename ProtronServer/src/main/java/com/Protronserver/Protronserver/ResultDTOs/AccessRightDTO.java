package com.Protronserver.Protronserver.ResultDTOs;

public class AccessRightDTO {

    private Long accessId;
    private String moduleName;
    private boolean canView;
    private boolean canEdit;
    private boolean canDelete;

    public AccessRightDTO(Long accessId, String moduleName, boolean canView, boolean canEdit, boolean canDelete) {
        this.accessId = accessId;
        this.moduleName = moduleName;
        this.canView = canView;
        this.canEdit = canEdit;
        this.canDelete = canDelete;
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
