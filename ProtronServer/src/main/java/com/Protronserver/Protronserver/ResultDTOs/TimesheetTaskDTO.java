package com.Protronserver.Protronserver.ResultDTOs;

import com.Protronserver.Protronserver.Entities.TimesheetTaskAttachment;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.Date;
import java.util.List;

public class TimesheetTaskDTO {
    private Long taskId;
    private String taskType;
    private Date date;
    private String projectName;
    private Long projectId;
    private Double hoursSpent;
    private String description;
    private boolean submitted;

    @JsonIgnoreProperties({"timesheetTask"})
    private List<TimesheetTaskAttachmentDTO> attachments;

    public TimesheetTaskDTO(Long taskId, String taskType, Date date, String projectName, Long projectId,
                            Double hoursSpent, String description, boolean submitted) {
        this.taskId = taskId;
        this.taskType = taskType;
        this.date = date;
        this.projectName = projectName;
        this.projectId = projectId;
        this.hoursSpent = hoursSpent;
        this.description = description;
        this.submitted = submitted;
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

    public Double getHoursSpent() {
        return hoursSpent;
    }

    public void setHoursSpent(Double hoursSpent) {
        this.hoursSpent = hoursSpent;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isSubmitted() {
        return submitted;
    }

    public void setSubmitted(boolean submitted) {
        submitted = submitted;
    }

    public List<TimesheetTaskAttachmentDTO> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<TimesheetTaskAttachmentDTO> attachments) {
        this.attachments = attachments;
    }
}
