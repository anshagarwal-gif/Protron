package com.protron.Protron.Dto;

public class ApprovalDTO {

    private Long approverId;
    private String approverEmail; // Assuming the Approver entity has a name
    private String status;
    private String reason;

    public ApprovalDTO(Long approverId, String approverEmail, String status, String reason) {
        this.approverId = approverId;
        this.approverEmail = approverEmail;
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

    public String getApproverEmail() {
        return approverEmail;
    }

    public void setApproverEmail(String approverEmail) {
        this.approverEmail = approverEmail;
    }
}
