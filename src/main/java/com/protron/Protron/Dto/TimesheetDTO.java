package com.protron.Protron.Dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class TimesheetDTO {
    private Long employeeId; // Only the employee ID, not the full Employee object
    private LocalDate date; // Date of the timesheet
    private int taskDuration; // Total duration of tasks in hours
    private String status; // Status of the timesheet (Pending, Approved, Rejected)
    private List<TaskDTO> tasks; // List of task details
}
