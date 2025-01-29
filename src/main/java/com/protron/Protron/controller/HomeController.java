package com.protron.Protron.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import com.protron.Protron.service.TimesheetWorkflowService;

@Controller
@CrossOrigin(origins = "http://localhost:5173")

public class HomeController {

    @Autowired
    private TimesheetWorkflowService timesheetWorkflowService;

    @PostMapping("/submit")
    public ResponseEntity<String> submitTimesheet(
            @RequestParam String employeeId,
            @RequestParam String timesheetId) {
        String processId = timesheetWorkflowService.startTimesheetApproval(employeeId, timesheetId);
        return ResponseEntity.ok(processId);
    }

    @PostMapping("/approve/{taskId}")
    public ResponseEntity<Void> approveTimesheet(
            @PathVariable String taskId,
            @RequestParam String managerId) {
        timesheetWorkflowService.approveTimesheet(taskId, managerId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reject/{taskId}")
    public ResponseEntity<Void> rejectTimesheet(
            @PathVariable String taskId,
            @RequestParam String managerId,
            @RequestParam String reason) {
        timesheetWorkflowService.rejectTimesheet(taskId, managerId, reason);
        return ResponseEntity.ok().build();
    }
}
