package com.protron.Protron.Dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalTime;

@Getter
@Setter
public class TaskDTO {
    private String taskName; // Name of the task
    private String taskDescription; // Task details
    private int duration; // Task duration in minutes or hours
    private LocalTime startTime; // Task start time
    private LocalTime endTime; // Task end time
}
