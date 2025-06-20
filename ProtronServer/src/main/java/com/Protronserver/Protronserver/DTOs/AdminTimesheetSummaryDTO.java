package com.Protronserver.Protronserver.DTOs;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AdminTimesheetSummaryDTO {
    private Long userId;
    private String name;
    private String email;
    private Map<String, Double> dailyHours; // Date string -> hours worked
    private double totalHours;

    // Constructors, Getters, Setters


    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Map<String, Double> getDailyHours() {
        return dailyHours;
    }

    public void setDailyHours(Map<String, Double> dailyHours) {
        this.dailyHours = dailyHours;
    }

    public double getTotalHours() {
        return totalHours;
    }

    public void setTotalHours(double totalHours) {
        this.totalHours = totalHours;
    }
}

