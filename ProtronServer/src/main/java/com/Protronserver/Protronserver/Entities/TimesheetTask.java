package com.Protronserver.Protronserver.Entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.Date;

@Getter
@Setter
@Entity
@Table(name = "timesheet_tasks")
public class TimesheetTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long taskId;
    private String taskType;
    private Date date;
    private Integer hoursSpent;
    private String description;

    @Lob
    @Column(name = "attachment", columnDefinition = "LONGBLOB")
    private byte[] attachment;

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
}
