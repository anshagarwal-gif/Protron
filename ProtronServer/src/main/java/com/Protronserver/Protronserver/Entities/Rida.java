package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "rida")
public class Rida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Project reference
    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    // Tenant reference
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "project_name", nullable = false)
    private String projectName;

    @Column(name = "meeting_reference")
    private String meetingReference;

    @Column(name = "item_description", length = 500)
    private String itemDescription;

    @Column(length = 1)
    private String type; // R = Risk, I = Issue, D = Decision, A = Action

    @Column(name = "raised_on", nullable = false)
    private LocalDateTime raisedOn = LocalDateTime.now();

    @Column(name = "raised_by")
    private String raisedBy;  // Could be linked to User in future

    @Column(name = "owner")
    private String owner; // Could be linked to User in future

    @Column(name = "status")
    private String status; // Open, WIP, Closed, Hold, YTS, De-prioritised, Cancelled

    @Column(name = "remarks", length = 1000)
    private String remarks;

    private LocalDateTime startTimestamp;
    private LocalDateTime endTimestamp;
    private String lastUpdatedBy;

    public LocalDateTime getStartTimestamp() {
        return startTimestamp;
    }

    public void setStartTimestamp(LocalDateTime startTimestamp) {
        this.startTimestamp = startTimestamp;
    }

    public LocalDateTime getEndTimestamp() {
        return endTimestamp;
    }

    public void setEndTimestamp(LocalDateTime endTimestamp) {
        this.endTimestamp = endTimestamp;
    }

    public String getLastUpdatedBy() {
        return lastUpdatedBy;
    }

    public void setLastUpdatedBy(String lastUpdatedBy) {
        this.lastUpdatedBy = lastUpdatedBy;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public Long getTenantId() {
        return tenantId;
    }

    public void setTenantId(Long tenantId) {
        this.tenantId = tenantId;
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
