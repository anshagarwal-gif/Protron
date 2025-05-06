package com.Protronserver.Protronserver.DTOs;

import com.Protronserver.Protronserver.Entities.Systemimpacted;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;
import java.util.List;

@Getter
@Setter
public class ProjectUpdateDTO {

    private String projectName;
    private String projectIcon;
    private Date startDate;
    private Date endDate;
    private Double projectCost;
    private Long projectManagerId;
    private Long sponsorId;
    private String unit;
    private List<SystemImpactedDTO> systemImpacted;
    private List<Long> removedSystems;

    public List<Long> getRemovedSystems() {
        return removedSystems;
    }

    public void setRemovedSystems(List<Long> removedSystems) {
        this.removedSystems = removedSystems;
    }

    public String getProjectName() {
        return projectName;
    }


    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public String getProjectIcon() {
        return projectIcon;
    }

    public void setProjectIcon(String projectIcon) {
        this.projectIcon = projectIcon;
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

    public Long getProjectManagerId() {
        return projectManagerId;
    }

    public void setProjectManagerId(Long projectManagerId) {
        this.projectManagerId = projectManagerId;
    }

    public Long getSponsorId() {
        return sponsorId;
    }

    public void setSponsorId(Long sponsorId) {
        this.sponsorId = sponsorId;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public List<SystemImpactedDTO> getSystemImpacted() {
        return systemImpacted;
    }

    public void setSystemImpacted(List<SystemImpactedDTO> systemImpacted) {
        this.systemImpacted = systemImpacted;
    }
}
