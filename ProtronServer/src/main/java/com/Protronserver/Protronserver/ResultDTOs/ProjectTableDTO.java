package com.Protronserver.Protronserver.ResultDTOs;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@JsonInclude(JsonInclude.Include.ALWAYS)
public class ProjectTableDTO {
    private String projectCode;
    private Long projectId;
    private String projectName;
    private Date startDate;
    private Long pmId;
    private String pmName;
    private Long sponsorId;
    private String sponsorName;
    private String unit;
    private Double projectCost;
    private int projectTeamCount;
    private LocalDateTime startTimestamp;
    @JsonProperty("businessValueAmount")
    private BigDecimal businessValueAmount;

    @JsonProperty("businessValueType")
    private String businessValueType;

    public ProjectTableDTO(String projectCode, Long projectId, String projectName, Date startDate,
                           Long pmId, String pmName, Long sponsorId, String sponsorName,
                           String unit, Double projectCost, int projectTeamCount, LocalDateTime startTimestamp,
                           BigDecimal businessValueAmount, String businessValueType) {
        this.projectCode = projectCode;
        this.projectId = projectId;
        this.projectName = projectName;
        this.startDate = startDate;
        this.pmId = pmId;
        this.pmName = pmName;
        this.sponsorId = sponsorId;
        this.sponsorName = sponsorName;
        this.unit = unit;
        this.projectCost = projectCost;
        this.projectTeamCount = projectTeamCount;
        this.startTimestamp = startTimestamp;
        this.businessValueAmount = businessValueAmount;
        this.businessValueType = businessValueType;
    }

    public LocalDateTime getStartTimestamp() {
        return startTimestamp;
    }

    public void setStartTimestamp(LocalDateTime startTimestamp) {
        this.startTimestamp = startTimestamp;
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

    public String getProjectCode() {
        return projectCode;
    }

    public void setProjectCode(String projectCode) {
        this.projectCode = projectCode;
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

    public Long getPmId() {
        return pmId;
    }

    public void setPmId(Long pmId) {
        this.pmId = pmId;
    }

    public String getPmName() {
        return pmName;
    }

    public void setPmName(String pmName) {
        this.pmName = pmName;
    }

    public Long getSponsorId() {
        return sponsorId;
    }

    public void setSponsorId(Long sponsorId) {
        this.sponsorId = sponsorId;
    }

    public String getSponsorName() {
        return sponsorName;
    }

    public void setSponsorName(String sponsorName) {
        this.sponsorName = sponsorName;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Double getProjectCost() {
        return projectCost;
    }

    public void setProjectCost(Double projectCost) {
        this.projectCost = projectCost;
    }

    public int getProjectTeamCount() {
        return projectTeamCount;
    }

    public void setProjectTeamCount(int projectTeamCount) {
        this.projectTeamCount = projectTeamCount;
    }
}

