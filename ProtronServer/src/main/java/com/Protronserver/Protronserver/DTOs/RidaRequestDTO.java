package com.Protronserver.Protronserver.DTOs;

import org.springframework.cglib.core.Local;

import java.time.LocalDate;

public class RidaRequestDTO {

    private String projectName;
    private String meetingReference;
    private String itemDescription;
    private String type; // R, I, D, A
    private String raisedBy;
    private String owner;
    private LocalDate dateRaised;
    private LocalDate targetCloser;
    private String status;
    private String remarks;

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

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
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
