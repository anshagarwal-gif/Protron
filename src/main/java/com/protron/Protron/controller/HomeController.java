package com.protron.Protron.controller;

import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;

import java.util.*;

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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import com.protron.Protron.Dto.TimesheetDTO;
import com.protron.Protron.entities.Timesheet;
import com.protron.Protron.service.TimesheetService;
import com.protron.Protron.service.TimesheetWorkflowService;

import org.flowable.task.api.Task;

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
            @RequestParam(value = "approverEmails", required = false) List<String> approverEmails) {

        System.out.println("=== Debug Information ===");
        System.out.println("Employee ID: " + employeeId);
        System.out.println("Timesheet ID: " + timesheetId);
        System.out.println("Approver Emails: " + (approverEmails != null ? approverEmails : "null"));

        if (approverEmails == null || approverEmails.isEmpty()) {
            return ResponseEntity.badRequest().body("Approver emails are required");
        }

        try {
            // Create approvals in the database
            for (String email : approverEmails) {
                Approver approver = approverRepository.findByEmail(email);
                if (approver == null) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body("Approver with email " + email + " not found.");
                }
                approvalService.addApproval(approver.getApproverId(), timesheetId);
            }

            // Start the Flowable process
            Map<String, Object> variables = new HashMap<>();
            variables.put("initiator", employeeId);
            variables.put("timesheetId", timesheetId);
            variables.put("approverList", approverEmails);
            variables.put("allApproved", true); // Initial state
            variables.put("currentApprovalCount", 0);
            variables.put("totalApprovers", approverEmails.size());

            String processInstanceId = runtimeService.startProcessInstanceByKey(
                    "timesheetApprovalProcess",
                    variables).getProcessInstanceId();

            System.out.println("Started Process with ID: " + processInstanceId);
            timesheetService.updateTimesheetStatus(timesheetId, "Pending");

            return ResponseEntity.ok(processInstanceId);
        } catch (Exception e) {
            System.out.println("Error submitting timesheet: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error submitting timesheet: " + e.getMessage());
        }
    }

    @PostMapping("/approve/{timesheetId}")
    public ResponseEntity<String> approveTimesheet(@PathVariable Long timesheetId) {
        try {
            String processInstanceId = timesheetWorkflowService.getProcessInstanceIdByTimesheetId(timesheetId);
            if (processInstanceId == null) {
                return ResponseEntity.badRequest().body("No active process found for timesheet");
            }

            // Get current task and extract assignee (approver's email)
            Task currentTask = taskService.createTaskQuery()
                    .processInstanceId(processInstanceId)
                    .singleResult();

            if (currentTask == null || currentTask.getAssignee() == null) {
                return ResponseEntity.badRequest().body("No active task found for current approver");
            }

            String approverEmail = currentTask.getAssignee(); // Extract email from task assignment
            System.out.println(approverEmail);
            // Check if this approver has already approved
            @SuppressWarnings("unchecked")
            List<String> approvedBy = (List<String>) runtimeService.getVariable(processInstanceId, "approvedBy");
            if (approvedBy == null) {
                approvedBy = new ArrayList<>();
            }

            if (approvedBy.contains(approverEmail)) {
                return ResponseEntity.badRequest().body("You have already approved this timesheet");
            }

            // Claim and complete the task
            taskService.claim(currentTask.getId(), approverEmail);

            // Add this approver to the approved list
            approvedBy.add(approverEmail);
            runtimeService.setVariable(processInstanceId, "approvedBy", approvedBy);

            Map<String, Object> variables = new HashMap<>();
            variables.put("approved", true);
            variables.put("approverEmail", approverEmail);

            // Update approval count
            Integer currentCount = (Integer) runtimeService.getVariable(processInstanceId, "currentApprovalCount");
            Integer totalApprovers = (Integer) runtimeService.getVariable(processInstanceId, "totalApprovers");

            if (currentCount == null) {
                currentCount = 0;
            }
            currentCount++;

            runtimeService.setVariable(processInstanceId, "currentApprovalCount", currentCount);

            approvalService.updateApprovalStatus(timesheetId, approverEmail, "Approved", "NA");

            // If all approvers have approved, update the timesheet status
            if (currentCount.equals(totalApprovers)) {
                variables.put("allApproved", true);
                timesheetService.updateTimesheetStatus(timesheetId, "Approved");
            }

            taskService.complete(currentTask.getId(), variables);

            return ResponseEntity.ok("Approval processed successfully");
        } catch (Exception e) {
            System.out.println("Error processing approval: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing approval: " + e.getMessage());
        }
    }

    @PostMapping("/reject/{timesheetId}")
    public ResponseEntity<String> rejectTimesheet(@PathVariable Long timesheetId, @RequestParam String reason) {
        try {
            String processInstanceId = timesheetWorkflowService.getProcessInstanceIdByTimesheetId(timesheetId);
            if (processInstanceId == null) {
                return ResponseEntity.badRequest().body("No active process found for timesheet");
            }

            // Get current task and extract assignee (approver's email)
            Task currentTask = taskService.createTaskQuery()
                    .processInstanceId(processInstanceId)
                    .singleResult();

            if (currentTask == null || currentTask.getAssignee() == null) {
                return ResponseEntity.badRequest().body("No active task found for current approver");
            }

            String approverEmail = currentTask.getAssignee(); // Extract email from task assignment

            // Check if this approver has already taken action
            @SuppressWarnings("unchecked")
            List<String> actedBy = (List<String>) runtimeService.getVariable(processInstanceId, "actedBy");
            if (actedBy == null) {
                actedBy = new ArrayList<>();
            }

            if (actedBy.contains(approverEmail)) {
                return ResponseEntity.badRequest().body("You have already acted on this timesheet");
            }

            // Claim and complete the task
            taskService.claim(currentTask.getId(), approverEmail);

            // Add this approver to the acted list
            actedBy.add(approverEmail);
            runtimeService.setVariable(processInstanceId, "actedBy", actedBy);

            Map<String, Object> variables = new HashMap<>();
            variables.put("approved", false);
            variables.put("allApproved", false);
            variables.put("rejectionReason", reason);
            variables.put("rejectedBy", approverEmail);

            taskService.complete(currentTask.getId(), variables);

            // Update timesheet status and reason
            timesheetService.updateTimesheetStatus(timesheetId, "Rejected");
            timesheetService.updateTimesheetRejectReason(timesheetId, reason);

            approvalService.updateApprovalStatus(timesheetId, approverEmail, "Rejected", reason);

            // Cancel all remaining tasks since one rejection is enough
            runtimeService.deleteProcessInstance(processInstanceId,
                    "Timesheet rejected by " + approverEmail + ": " + reason);

            return ResponseEntity.ok("Timesheet rejected successfully");
        } catch (Exception e) {
            System.out.println("Error processing rejection: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing rejection: " + e.getMessage());
        }
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
