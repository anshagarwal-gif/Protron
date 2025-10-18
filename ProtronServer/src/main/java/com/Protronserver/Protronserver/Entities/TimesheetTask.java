package com.Protronserver.Protronserver.Entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "timesheet_tasks")
public class TimesheetTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long taskId;
    private String taskType;
    private Date date;
    private int hoursSpent;
    private int minutesSpent;
    private int remainingHours;
    private int remainingMinutes;
    @Column(length = 100)
    private String taskTopic;
    @Column(length = 500)
    private String description;
    private boolean isSubmitted = true;

    private LocalDateTime startTimestamp;
    private LocalDateTime endTimestamp;

    private Long taskRef;

    private String lastUpdatedBy;
    // IMPORTANT: Make sure to eagerly fetch attachments or use @JsonProperty
    @OneToMany(mappedBy = "timesheetTask", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnoreProperties({ "timesheetTask" })
    private List<TimesheetTaskAttachment> attachments;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({ "timesheetTasks", "certificates", "userAccessRights", "role", "tenant", "projectTeams",
            "projectsManaged" })
    private User user;

    @ManyToOne
    @JoinColumn(name = "project_id")
    @JsonIgnoreProperties({ "sponsor", "tenant", "systemImpacted", "projectTeam", "timesheetTasks", "projectManager" })
    private Project project;

    @ManyToOne
    @JoinColumn(name = "tenant_id")
    @JsonIgnoreProperties({ "certificates", "projectTeams", "roleAccesses", "projects", "roles", "users" })
    private Tenant tenant;

    public int getRemainingHours() {
        return remainingHours;
    }

    public void setRemainingHours(int remainingHours) {
        this.remainingHours = remainingHours;
    }

    public int getRemainingMinutes() {
        return remainingMinutes;
    }

    public void setRemainingMinutes(int remainingMinutes) {
        this.remainingMinutes = remainingMinutes;
    }

    public Long getTaskId() {
        return taskId;
    }

    public void setTaskId(Long taskId) {
        this.taskId = taskId;
    }

    public String getTaskType() {
        return taskType;
    }

    public void setTaskType(String taskType) {
        this.taskType = taskType;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public int getHoursSpent() {
        return hoursSpent;
    }

    public void setHoursSpent(int hoursSpent) {
        this.hoursSpent = hoursSpent;
    }

    public int getMinutesSpent() {
        return minutesSpent;
    }

    public void setMinutesSpent(int minutesSpent) {
        this.minutesSpent = minutesSpent;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<TimesheetTaskAttachment> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<TimesheetTaskAttachment> attachments) {
        this.attachments = attachments;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public boolean isSubmitted() {
        return isSubmitted;
    }

    public void setSubmitted(boolean submitted) {
        isSubmitted = submitted;
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

    public String getTaskTopic() {
        return taskTopic;
    }

    public void setTaskTopic(String taskTopic) {
        this.taskTopic = taskTopic;
    }

    public Long getTaskRef() {
        return taskRef;
    }

    public void setTaskRef(Long taskRef) {
        this.taskRef = taskRef;
    }
}
