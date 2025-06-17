package com.Protronserver.Protronserver.DTOs;

import lombok.Getter;
import lombok.Setter;

import java.util.Date;

@Getter
@Setter
public class TimesheetTaskRequestDTO {
    private String taskType;
    private Date date;
    private Integer hoursSpent;
    private String description;
    private Long projectId;
}
