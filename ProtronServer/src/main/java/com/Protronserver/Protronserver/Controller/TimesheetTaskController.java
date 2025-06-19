package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.TimesheetTaskRequestDTO;
import com.Protronserver.Protronserver.Entities.TimesheetTask;
import com.Protronserver.Protronserver.Service.TimesheetTaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/timesheet-tasks")
public class TimesheetTaskController {

    @Autowired
    private TimesheetTaskService timesheetTaskService;

    @PostMapping("/add")
    public ResponseEntity<TimesheetTask> addTimesheetTask(@RequestBody TimesheetTaskRequestDTO dto) {
        TimesheetTask savedTask = timesheetTaskService.addTask(dto);
        return ResponseEntity.ok(savedTask);
    }

    @GetMapping("/between")
    public ResponseEntity<List<TimesheetTask>> getTasksBetweenDates(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date end
    ) {
        List<TimesheetTask> tasks = timesheetTaskService.getTasksBetweenDates(start, end);

        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/admin-between")
    public ResponseEntity<List<TimesheetTask>> getTasksForUserBetweenDates(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date end,
            @RequestParam("userId") Long userId) {
        List<TimesheetTask> tasks = timesheetTaskService.getTasksBetweenDatesForUser(start, end, userId);
        return ResponseEntity.ok(tasks);
    }

    @PostMapping("/copy-last-week")
    public ResponseEntity<String> copyLastWeekTasks(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date end) {
        timesheetTaskService.copyTasksToNextWeek(start, end);
        return ResponseEntity.ok("Tasks copied to next week successfully.");
    }

    @GetMapping("/total-hours")
    public ResponseEntity<Integer> getTotalHours(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date end) {
        int totalHours = timesheetTaskService.calculateTotalHours(start, end);
        return ResponseEntity.ok(totalHours);
    }

    @PutMapping("/edit/{taskId}")
    public ResponseEntity<TimesheetTask> editTask(
            @PathVariable Long taskId,
            @RequestBody TimesheetTaskRequestDTO dto) {
        TimesheetTask updated = timesheetTaskService.updateTask(taskId, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/delete/{taskId}")
    public ResponseEntity<String> deleteTask(@PathVariable Long taskId) {
        timesheetTaskService.deleteTask(taskId);
        return ResponseEntity.ok("Task deleted successfully.");
    }

}
