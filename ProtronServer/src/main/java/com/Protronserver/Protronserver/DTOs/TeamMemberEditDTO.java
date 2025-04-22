package com.Protronserver.Protronserver.DTOs;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class TeamMemberEditDTO {

    private Double pricing;
    private String unit;
    private String taskType;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate estimatedReleaseDate;

    public Double getPricing() {
        return pricing;
    }

    public void setPricing(Double pricing) {
        this.pricing = pricing;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public LocalDate getEstimatedReleaseDate() {
        return estimatedReleaseDate;
    }

    public void setEstimatedReleaseDate(LocalDate estimatedReleaseDate) {
        this.estimatedReleaseDate = estimatedReleaseDate;
    }

    public String getTaskType() {
        return taskType;
    }

    public void setTaskType(String taskType) {
        this.taskType = taskType;
    }
}
