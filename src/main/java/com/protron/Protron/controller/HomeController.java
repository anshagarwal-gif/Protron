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

    private List<String> convertToEmailList(Object approverEmailsObj) {
        if (approverEmailsObj instanceof String) {
            return Arrays.asList(((String) approverEmailsObj).split(","));
        } else if (approverEmailsObj instanceof List) {
            return (List<String>) approverEmailsObj;
        }
        return null;
    }

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
        String processInstanceId = timesheetWorkflowService.getProcessInstanceIdByTimesheetId(timesheetId);

        // Retrieve approver emails from Flowable process variables
        Object approverEmailsObj = runtimeService.getVariable(processInstanceId, "approverEmails");
        List<String> approverEmails = convertToEmailList(approverEmailsObj);

        if (approverEmails == null || approverEmails.isEmpty()) {
            return ResponseEntity.badRequest().body("Approver emails not found for timesheet " + timesheetId);
        }

        System.out.println("Approving Timesheet: " + timesheetId + ", Approver Emails: " + approverEmails);

        boolean allApproved = true;
        for (String approverEmail : approverEmails) {
            String taskId = timesheetWorkflowService.getTaskIdByTimesheetId(timesheetId, approverEmail);

            if (taskId == null) {
                System.out.println("No active task found for approver: " + approverEmail);
                allApproved = false;
                continue; // Instead of returning, continue to the next approver
            }

            try {
                taskService.claim(taskId, approverEmail);
                timesheetWorkflowService.approveTimesheet(taskId, approverEmail);
            } catch (Exception e) {
                System.out.println("Error approving task for " + approverEmail + ": " + e.getMessage());
                allApproved = false;
            }
        }

        // Update status based on whether all tasks were processed
        timesheetService.updateTimesheetStatus(timesheetId, allApproved ? "Approved" : "Pending");

        return ResponseEntity.ok(allApproved ? "Timesheet Approved by all approvers" : "Some approvals pending");
    }

    @PostMapping("/reject/{timesheetId}")
    public ResponseEntity<String> rejectTimesheet(@PathVariable Long timesheetId, @RequestParam String reason) {
        String processInstanceId = timesheetWorkflowService.getProcessInstanceIdByTimesheetId(timesheetId);

        // Retrieve approver emails from Flowable process variables
        Object approverEmailsObj = runtimeService.getVariable(processInstanceId, "approverEmails");
        List<String> approverEmails = convertToEmailList(approverEmailsObj);

        if (approverEmails == null || approverEmails.isEmpty()) {
            return ResponseEntity.badRequest().body("Approver emails not found for timesheet " + timesheetId);
        }

        System.out.println("Rejecting Timesheet: " + timesheetId + ", Approver Emails: " + approverEmails);

        boolean allRejected = true;
        for (String approverEmail : approverEmails) {
            String taskId = timesheetWorkflowService.getTaskIdByTimesheetId(timesheetId, approverEmail);

            if (taskId == null) {
                System.out.println("No active rejection task found for " + approverEmail);
                allRejected = false;
                continue;
            }

            try {
                taskService.claim(taskId, approverEmail);
                timesheetWorkflowService.rejectTimesheet(taskId, approverEmail, reason);
            } catch (Exception e) {
                System.out.println("Error rejecting task for " + approverEmail + ": " + e.getMessage());
                allRejected = false;
            }
        }

        timesheetService.updateTimesheetStatus(timesheetId, allRejected ? "Rejected" : "Pending");

        return ResponseEntity.ok(allRejected ? "Timesheet Rejected by all approvers" : "Some rejections pending");
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
