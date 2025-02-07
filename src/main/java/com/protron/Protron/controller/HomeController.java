package com.protron.Protron.controller;

import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.protron.Protron.entities.Approver;
import com.protron.Protron.repository.ApproverRepository;
import com.protron.Protron.service.ApprovalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import org.springframework.web.bind.annotation.RequestParam;

import com.protron.Protron.Dto.TimesheetDTO;
import com.protron.Protron.entities.Timesheet;
import com.protron.Protron.service.TimesheetService;
import com.protron.Protron.service.TimesheetWorkflowService;

@Controller
@CrossOrigin(origins = "http://localhost:5173")

public class HomeController {

    @Autowired
    private TimesheetService timesheetService;
    @Autowired
    private TimesheetWorkflowService timesheetWorkflowService;
    @Autowired
    private ApproverRepository approverRepository;
    @Autowired
    private ApprovalService approvalService;
    @Autowired
    private TaskService taskService;

    @Autowired
    private RuntimeService runtimeService;

    @PostMapping("/insert")
    public ResponseEntity<Timesheet> insertTimesheet(@RequestBody TimesheetDTO timesheetDTO) {
        Timesheet savedTimesheet = timesheetService.saveTimesheet(timesheetDTO);
        return ResponseEntity.ok(savedTimesheet);
    }

    @PostMapping("/submit")
    public ResponseEntity<String> submitTimesheet(
            @RequestParam String employeeId,
            @RequestParam Long timesheetId,
            @RequestParam(value = "approverEmails", required = false) List<String> approverEmails) { // Multiple emails

        System.out.println("=== Debug Information ===");
        System.out.println("Employee ID: " + employeeId);
        System.out.println("Timesheet ID: " + timesheetId);
        System.out.println("Approver Emails: " + (approverEmails != null ? approverEmails : "null"));

        if (approverEmails == null || approverEmails.isEmpty()) {
            return ResponseEntity.badRequest().body("Approver emails are required");
        }

        for (String email : approverEmails) {
            Approver approver = approverRepository.findByEmail(email);
            if (approver == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Approver with email " + email + " not found.");
            }
            approvalService.addApproval(approver.getApproverId(), timesheetId);
        }

        // Store emails as a comma-separated string for Flowable

        Map<String, Object> variables = new HashMap<>();
        variables.put("initiator", employeeId);
        variables.put("timesheetId", timesheetId);
        variables.put("approverEmails", approverEmails); // Pass as process variable

        String processInstanceId = runtimeService.startProcessInstanceByKey("timesheetApprovalProcess", variables)
                .getProcessInstanceId();

        System.out.println("Started Process with ID: " + processInstanceId);
        timesheetService.updateTimesheetStatus(timesheetId, "Pending");

        return ResponseEntity.ok(processInstanceId);
    }

    @PostMapping("/approve/{timesheetId}")
    public ResponseEntity<String> approveTimesheet(@PathVariable Long timesheetId) {

        // Retrieve approver emails from Flowable process variables
        Object approverEmailsObj = runtimeService.getVariable(
                timesheetWorkflowService.getProcessInstanceIdByTimesheetId(timesheetId),
                "approverEmails");

        List<String> approverEmails;
        if (approverEmailsObj instanceof String) {
            // If stored as a single comma-separated string, convert to List
            approverEmails = Arrays.asList(((String) approverEmailsObj).split(","));
        } else if (approverEmailsObj instanceof List) {
            // Safe cast if it was stored as a List
            approverEmails = (List<String>) approverEmailsObj;
        } else {
            return ResponseEntity.badRequest().body("Approver emails not found or invalid format.");
        }

        if (approverEmails == null || approverEmails.isEmpty()) {
            return ResponseEntity.badRequest().body("Approver emails not found for timesheet " + timesheetId);
        }

        System.out.println("Approving Timesheet: " + timesheetId + ", Approver Emails: " + approverEmails);

        for (String approverEmail : approverEmails) {
            // Get the task assigned to this approver
            String taskId = timesheetWorkflowService.getTaskIdByTimesheetId(timesheetId, approverEmail);

            if (taskId == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("No active approval task found for " + approverEmail);
            }

            // Claim and approve the task
            taskService.claim(taskId, approverEmail);
            timesheetWorkflowService.approveTimesheet(taskId, approverEmail);
        }

        // Update status (still Pending if other approvals are required)
        timesheetService.updateTimesheetStatus(timesheetId, "Approved");

        return ResponseEntity.ok("Timesheet Approved by all approvers");
    }

    @PostMapping("/reject/{timesheetId}")
    public ResponseEntity<String> rejectTimesheet(@PathVariable Long timesheetId, @RequestParam String reason) {

        // Retrieve approver emails from Flowable process variables
        Object approverEmailsObj = runtimeService.getVariable(
                timesheetWorkflowService.getProcessInstanceIdByTimesheetId(timesheetId),
                "approverEmails");

        List<String> approverEmails;
        if (approverEmailsObj instanceof String) {
            // If stored as a single comma-separated string, convert to List
            approverEmails = Arrays.asList(((String) approverEmailsObj).split(","));
        } else if (approverEmailsObj instanceof List) {
            // Safe cast if it was stored as a List
            approverEmails = (List<String>) approverEmailsObj;
        } else {
            return ResponseEntity.badRequest().body("Approver emails not found or invalid format.");
        }

        if (approverEmails == null || approverEmails.isEmpty()) {
            return ResponseEntity.badRequest().body("Approver emails not found for timesheet " + timesheetId);
        }

        System.out.println("Rejecting Timesheet: " + timesheetId + ", Approver Emails: " + approverEmails);

        for (String approverEmail : approverEmails) {
            // Get the task assigned to this approver
            String taskId = timesheetWorkflowService.getTaskIdByTimesheetId(timesheetId, approverEmail);

            if (taskId == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("No active rejection task found for " + approverEmail);
            }

            // Claim and reject the task
            taskService.claim(taskId, approverEmail);
            timesheetWorkflowService.rejectTimesheet(taskId, approverEmail, reason);
        }

        // Update status
        timesheetService.updateTimesheetStatus(timesheetId, "Rejected");

        return ResponseEntity.ok("Timesheet Rejected by all approvers");
    }

    @GetMapping("/pendingApprovals/{managerId}")
    public ResponseEntity<List<Map<String, Object>>> getPendingApprovals(@PathVariable String managerId) {
        List<Map<String, Object>> pendingApprovals = timesheetWorkflowService.getPendingApprovals(managerId);
        return ResponseEntity.ok(pendingApprovals);
    }

    @PostMapping("/resubmit/{taskId}")
    public ResponseEntity<Void> resubmitTimesheet(
            @PathVariable String taskId,
            @RequestParam String employeeId) {
        timesheetWorkflowService.resubmitTimesheet(taskId, employeeId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/delete/{timesheetId}")
    public ResponseEntity<String> deleteTimesheet(@PathVariable Long timesheetId) {
        timesheetService.deleteTimesheet(timesheetId);
        return ResponseEntity.ok("Timesheet deleted successfully");
    }

    @GetMapping("/timesheets/{employeeId}")
    public ResponseEntity<List<TimesheetDTO>> getAllTimeSheetsForEmployee(@PathVariable Long employeeId) {
        List<TimesheetDTO> timesheets = timesheetService.getTimesheetsForEmployee(employeeId);
        return ResponseEntity.ok(timesheets);
    }

}
