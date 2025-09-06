package com.Protronserver.Protronserver.ResultDTOs;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class ProjectTeamMemberDTO {
    private Long projectTeamId;
    private Long userId;
    private String name;
    private String empCode;
    private String email;
    private String unit;
    private Double pricing;
    private Long systemId;
    private String systemName;
    private LocalDate estimatedReleaseDate;
    private LocalDate onBoardingDate;
    private String status;
    private LocalDateTime startTimestamp;

    public ProjectTeamMemberDTO(Long projectTeamId, Long userId, String name, String empCode, String email,
                                String unit, Double pricing,Long systemId, String systemName,
                                LocalDate estimatedReleaseDate, LocalDate onBoardingDate, String status, LocalDateTime startTimestamp) {
        this.projectTeamId = projectTeamId;
        this.userId = userId;
        this.name = name;
        this.empCode = empCode;
        this.email = email;
        this.unit = unit;
        this.pricing = pricing;
        this.systemId = systemId;
        this.systemName = systemName;
        this.estimatedReleaseDate = estimatedReleaseDate;
        this.onBoardingDate = onBoardingDate;
        this.status = status;
        this.startTimestamp = startTimestamp;
    }

    public LocalDateTime getStartTimestamp() {
        return startTimestamp;
    }

    public void setStartTimestamp(LocalDateTime startTimestamp) {
        this.startTimestamp = startTimestamp;
    }

    public Long getSystemId() {
        return systemId;
    }

    public void setSystemId(Long systemId) {
        this.systemId = systemId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getSystemName() {
        return systemName;
    }

    public void setSystemName(String systemName) {
        this.systemName = systemName;
    }

    public Long getProjectTeamId() {
        return projectTeamId;
    }

    public void setProjectTeamId(Long projectTeamId) {
        this.projectTeamId = projectTeamId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmpCode() {
        return empCode;
    }

    public void setEmpCode(String empCode) {
        this.empCode = empCode;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Double getPricing() {
        return pricing;
    }

    public void setPricing(Double pricing) {
        this.pricing = pricing;
    }

    public LocalDate getEstimatedReleaseDate() {
        return estimatedReleaseDate;
    }

    public void setEstimatedReleaseDate(LocalDate estimatedReleaseDate) {
        this.estimatedReleaseDate = estimatedReleaseDate;
    }

    public LocalDate getOnBoardingDate() {
        return onBoardingDate;
    }

    public void setOnBoardingDate(LocalDate onBoardingDate) {
        this.onBoardingDate = onBoardingDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
