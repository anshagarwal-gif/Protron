package com.Protronserver.Protronserver.ResultDTOs;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class RidaResultDTO {

    private Long id;
    private String projectName;
    private Long projectId;
    private String tenantName;
    private String meetingReference;
    private String itemDescription;
    private String type;
    private LocalDateTime raisedOn;
    private String raisedBy;
    private String owner;
    private LocalDate dateRaised;
    private LocalDate targetCloser;
    private String status;
    private String remarks;

    // constructor
    public RidaResultDTO(Long id, String projectName, Long projectId, String tenantName,
                         String meetingReference, String itemDescription, String type,
                         LocalDateTime raisedOn, String raisedBy, String owner, LocalDate dateRaised, LocalDate targetCloser,
                         String status, String remarks) {
        this.id = id;
        this.projectName = projectName;
        this.projectId = projectId;
        this.tenantName = tenantName;
        this.meetingReference = meetingReference;
        this.itemDescription = itemDescription;
        this.type = type;
        this.raisedOn = raisedOn;
        this.raisedBy = raisedBy;
        this.owner = owner;
        this.dateRaised = dateRaised;
        this.targetCloser = targetCloser;
        this.status = status;
        this.remarks = remarks;
    }

    public LocalDate getDateRaised() {
        return dateRaised;
    }

    public void setDateRaised(LocalDate dateRaised) {
        this.dateRaised = dateRaised;
    }

    public LocalDate getTargetCloser() {
        return targetCloser;
    }

    public void setTargetCloser(LocalDate targetCloser) {
        this.targetCloser = targetCloser;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getTenantName() {
        return tenantName;
    }

    public void setTenantName(String tenantName) {
        this.tenantName = tenantName;
    }

    public String getMeetingReference() {
        return meetingReference;
    }

    public void setMeetingReference(String meetingReference) {
        this.meetingReference = meetingReference;
    }

    public String getItemDescription() {
        return itemDescription;
    }

    public void setItemDescription(String itemDescription) {
        this.itemDescription = itemDescription;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public LocalDateTime getRaisedOn() {
        return raisedOn;
    }

    public void setRaisedOn(LocalDateTime raisedOn) {
        this.raisedOn = raisedOn;
    }

    public String getRaisedBy() {
        return raisedBy;
    }

    public void setRaisedBy(String raisedBy) {
        this.raisedBy = raisedBy;
    }

    public String getOwner() {
        return owner;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
