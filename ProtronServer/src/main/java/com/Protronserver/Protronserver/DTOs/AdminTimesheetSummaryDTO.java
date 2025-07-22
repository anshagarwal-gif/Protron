package com.Protronserver.Protronserver.DTOs;

import com.Protronserver.Protronserver.Utils.TimeEntry;
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
    private Map<String, TimeEntry> dailyHours;
    private int totalHours;
    private int totalMinutes;


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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Map<String, TimeEntry> getDailyHours() {
        return dailyHours;
    }

    public void setDailyHours(Map<String, TimeEntry> dailyHours) {
        this.dailyHours = dailyHours;
    }

    public int getTotalHours() {
        return totalHours;
    }

    public void setTotalHours(int totalHours) {
        this.totalHours = totalHours;
    }

    public int getTotalMinutes() {
        return totalMinutes;
    }

    public void setTotalMinutes(int totalMinutes) {
        this.totalMinutes = totalMinutes;
    }
}

