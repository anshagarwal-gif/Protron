package com.Protronserver.Protronserver.Entities;

import com.fasterxml.jackson.annotation.*;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

//@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "projectId")
@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "projects")
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long projectId;
    @Column(unique = true, nullable = false)
    private String projectCode;
    private String projectName;
    private Date startDate;
    private Date endDate;
    private String unit;

    private Double projectCost;

    // Added timestamp fields
    private LocalDateTime startTimestamp;
    private LocalDateTime endTimestamp;

    // Added last updated by field
    private String lastUpdatedBy;

    // --- NEW FIELDS ---
    private String productOwner;
    private String scrumMaster;
    private String architect;
    private String chiefScrumMaster;
    private String deliveryLeader;
    private String businessUnitFundedBy;
    private String businessUnitDeliveredTo;

    @Column(name = "priority", columnDefinition = "INT CHECK (priority >= 1 AND priority <= 10)")
    private Integer priority; // (1–10)

    @Temporal(TemporalType.TIMESTAMP)
    private Date createdOn;

    @Column(length = 500)
    private String defineDone;

    @Column(name = "business_value_amount")
    private BigDecimal businessValueAmount;

    @Column(name = "business_value_type")
    private String businessValueType;

    @ManyToOne
    @JoinColumn(name = "sponsor")
    @JsonIgnoreProperties({ "projectsManaged", "projectTeams", "tenant" })
    private User sponsor;

    public String getProjectCode() {
        return projectCode;
    }

    public void setProjectCode(String projectCode) {
        this.projectCode = projectCode;
    }

    public User getSponsor() {
        return sponsor;
    }

    public void setSponsor(User sponsor) {
        this.sponsor = sponsor;
    }

    // Getters and setters for the new fields
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

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public void setLastUpdatedBy(String lastUpdatedBy) {
        this.lastUpdatedBy = lastUpdatedBy;
    }

    @ManyToOne
    @JoinColumn(name = "project_manager_id")
    @JsonIgnoreProperties({ "projectsManaged", "tenant", "projectTeams" })
    private User projectManager;

    @OneToMany(mappedBy = "project")
    @JsonIgnoreProperties({ "project", "user", "tenant" })
    @Where(clause = "end_timestamp IS NULL")
    private List<TimesheetTask> timesheetTasks;

    @OneToMany(mappedBy = "project")
    @JsonIgnoreProperties("project")
    @Where(clause = "end_timestamp IS NULL")
    private List<ProjectTeam> projectTeam;

    @OneToMany(mappedBy = "project")
    @JsonIgnoreProperties({ "project", "tenant", "projectTeams" })
    @Where(clause = "end_timestamp IS NULL")
    private List<Systemimpacted> systemImpacted;

    @ManyToOne
    @JoinColumn(name = "tenant_id")
    @JsonIgnoreProperties({ "users", "projects", "roles", "roleAccesses" })
    private Tenant tenant;

    public List<Systemimpacted> getSystemImpacted() {
        return systemImpacted;
    }

    public void setSystemImpacted(List<Systemimpacted> systemImpacted) {
        this.systemImpacted = systemImpacted;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public Date getStartDate() {
        return startDate;
    }

    public void setStartDate(Date startDate) {
        this.startDate = startDate;
    }

    public Date getEndDate() {
        return endDate;
    }

    public void setEndDate(Date endDate) {
        this.endDate = endDate;
    }

    public Double getProjectCost() {
        return projectCost;
    }

    public void setProjectCost(Double projectCost) {
        this.projectCost = projectCost;
    }

    public User getProjectManager() {
        return projectManager;
    }

    public void setProjectManager(User projectManager) {
        this.projectManager = projectManager;
    }

    public List<TimesheetTask> getTimesheetTasks() {
        return timesheetTasks;
    }

    public void setTimesheetTasks(List<TimesheetTask> timesheetTasks) {
        this.timesheetTasks = timesheetTasks;
    }

    public List<ProjectTeam> getProjectTeam() {
        return projectTeam;
    }

    public void setProjectTeam(List<ProjectTeam> projectTeam) {
        this.projectTeam = projectTeam;
    }

    public Tenant getTenant() {
        return tenant;
    }

    public void setTenant(Tenant tenant) {
        this.tenant = tenant;
    }

    public String getProductOwner() {
        return productOwner;
    }

    public void setProductOwner(String productOwner) {
        this.productOwner = productOwner;
    }

    public String getScrumMaster() {
        return scrumMaster;
    }

    public void setScrumMaster(String scrumMaster) {
        this.scrumMaster = scrumMaster;
    }

    public String getArchitect() {
        return architect;
    }

    public void setArchitect(String architect) {
        this.architect = architect;
    }

    public String getChiefScrumMaster() {
        return chiefScrumMaster;
    }

    public void setChiefScrumMaster(String chiefScrumMaster) {
        this.chiefScrumMaster = chiefScrumMaster;
    }

    public String getDeliveryLeader() {
        return deliveryLeader;
    }

    public void setDeliveryLeader(String deliveryLeader) {
        this.deliveryLeader = deliveryLeader;
    }

    public String getBusinessUnitFundedBy() {
        return businessUnitFundedBy;
    }

    public void setBusinessUnitFundedBy(String businessUnitFundedBy) {
        this.businessUnitFundedBy = businessUnitFundedBy;
    }

    public String getBusinessUnitDeliveredTo() {
        return businessUnitDeliveredTo;
    }

    public void setBusinessUnitDeliveredTo(String businessUnitDeliveredTo) {
        this.businessUnitDeliveredTo = businessUnitDeliveredTo;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    public Date getCreatedOn() {
        return createdOn;
    }

    public void setCreatedOn(Date createdOn) {
        this.createdOn = createdOn;
    }

    public String getDefineDone() {
        return defineDone;
    }

    public void setDefineDone(String defineDone) {
        this.defineDone = defineDone;
    }

    public BigDecimal getBusinessValueAmount() {
        return businessValueAmount;
    }

    public void setBusinessValueAmount(BigDecimal businessValueAmount) {
        this.businessValueAmount = businessValueAmount;
    }

    public String getBusinessValueType() {
        return businessValueType;
    }

    public void setBusinessValueType(String businessValueType) {
        this.businessValueType = businessValueType;
    }
}