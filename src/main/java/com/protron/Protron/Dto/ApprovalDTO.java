package com.protron.Protron.Dto;

public class ApprovalDTO {

    private Long approverId;
    private String approverName; // Assuming the Approver entity has a name
    private String status;
    private String reason;

    public ApprovalDTO(Long approverId, String approverName, String status, String reason) {
        this.approverId = approverId;
        this.approverName = approverName;
        this.status = status;
        this.reason = reason;
    }

    // Getters and Setters
    public Long getApproverId() {
        return approverId;
    }

    public void setApproverId(Long approverId) {
        this.approverId = approverId;
    }

    public String getApproverName() {
        return approverName;
    }

    public void setApproverName(String approverName) {
        this.approverName = approverName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

}
