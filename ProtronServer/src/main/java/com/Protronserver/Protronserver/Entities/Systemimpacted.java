package com.Protronserver.Protronserver.Entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
public class Systemimpacted {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long systemId;

    private String systemName;
    private LocalDateTime startTimestamp;
    private LocalDateTime endTimestamp;
    private String lastUpdatedBy;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToMany(mappedBy = "systemimpacted")
    @JsonIgnoreProperties({"tenant", "project", "systemimpacted"})
    private List<ProjectTeam> projectTeams;

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

    // Getters and Setters
    public Long getSystemId() {
        return systemId;
    }

    public void setSystemId(Long systemId) {
        this.systemId = systemId;
    }

    public String getSystemName() {
        return systemName;
    }

    public void setSystemName(String systemName) {
        this.systemName = systemName;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public Tenant getTenant() {
        return tenant;
    }

    public void setTenant(Tenant tenant) {
        this.tenant = tenant;
    }

    public List<ProjectTeam> getProjectTeams() {
        return projectTeams;
    }

    public void setProjectTeams(List<ProjectTeam> projectTeams) {
        this.projectTeams = projectTeams;
    }
}
