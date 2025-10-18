package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "user_story_table")
public class UserStory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 15, unique = true)
    private String usId;

    // @Column(name = "tenant_id")
    private Long tenantId;

    // @Column(name = "project_id")
    private Long projectId;

    @Column(length = 15)
    private String parentId;

    @Column(length = 100)
    private String status;

    // @Column(name = "priority")
    private int priority;

    @Column(length = 500)
    private String summary;

    @Column(name = "as_a", length = 150)
    private String asA;

    @Column(name = "i_want_to", length = 500)
    private String iWantTo;

    @Column(name = "so_that", length = 500)
    private String soThat;

    @Column(name = "acceptance_criteria", length = 1000)
    private String acceptanceCriteria;

    @Column(length = 100)
    private String systemName;

    // @Column(name = "story_points")
    private int storyPoints;

    @Column(length = 100)
    private String assignee;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "date_created")
    private LocalDateTime dateCreated;
    private Long releaseId;
    private Long sprint;

    // Fields for versioning and soft delete
    private LocalDateTime startTimestamp;

    @Column(name = "end_timestamp")
    private LocalDateTime endTimestamp;

    @Column(name = "last_updated_by")
    private String lastUpdatedBy;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsId() {
        return usId;
    }

    public void setUsId(String usId) {
        this.usId = usId;
    }

    public Long getTenantId() {
        return tenantId;
    }

    public void setTenantId(Long tenantId) {
        this.tenantId = tenantId;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getParentId() {
        return parentId;
    }

    public void setParentId(String parentId) {
        this.parentId = parentId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getPriority() {
        return priority;
    }

    public void setPriority(int priority) {
        this.priority = priority;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getAsA() {
        return asA;
    }

    public void setAsA(String asA) {
        this.asA = asA;
    }

    public String getIWantTo() {
        return iWantTo;
    }

    public String getiWantTo() {
        return iWantTo;
    }

    public void setiWantTo(String iWantTo) {
        this.iWantTo = iWantTo;
    }

    public void setIWantTo(String iWantTo) {
        this.iWantTo = iWantTo;
    }

    public String getSoThat() {
        return soThat;
    }

    public void setSoThat(String soThat) {
        this.soThat = soThat;
    }

    public String getAcceptanceCriteria() {
        return acceptanceCriteria;
    }

    public void setAcceptanceCriteria(String acceptanceCriteria) {
        this.acceptanceCriteria = acceptanceCriteria;
    }

    public String getSystem() {
        return systemName;
    }

    public void setSystem(String system) {
        this.systemName = system;
    }

    public int getStoryPoints() {
        return storyPoints;
    }

    public void setStoryPoints(int storyPoints) {
        this.storyPoints = storyPoints;
    }

    public String getAssignee() {
        return assignee;
    }

    public void setAssignee(String assignee) {
        this.assignee = assignee;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getDateCreated() {
        return dateCreated;
    }

    public void setDateCreated(LocalDateTime dateCreated) {
        this.dateCreated = dateCreated;
    }

    public Long getRelease() {
        return releaseId;
    }

    public void setRelease(Long release) {
        this.releaseId = release;
    }

    public Long getSprint() {
        return sprint;
    }

    public void setSprint(Long sprint) {
        this.sprint = sprint;
    }

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
}
