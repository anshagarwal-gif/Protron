package com.protron.Protron.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.protron.Protron.entities.Approver;
import com.protron.Protron.repository.ApproverRepository;
import com.protron.Protron.service.ApprovalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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

    @PostMapping("/insert")
    public ResponseEntity<Timesheet> insertTimesheet(@RequestBody TimesheetDTO timesheetDTO) {
        Timesheet savedTimesheet = timesheetService.saveTimesheet(timesheetDTO);
        return ResponseEntity.ok(savedTimesheet);
    }

    @PostMapping("/submit")
    public ResponseEntity<String> submitTimesheet(
            @RequestParam String employeeId,
            @RequestParam Long timesheetId,
            @RequestParam(value = "approvers", required = false) List<String> approvers) {

        String processId = timesheetWorkflowService.startTimesheetApproval(employeeId, timesheetId);
//        System.out.println(processId);
//        System.out.println(approvers);

        timesheetService.updateTimesheetStatus(timesheetId , "Pending");

        for(String email: approvers){
            Approver approver = approverRepository.findByEmail(email);
            approvalService.addApproval(approver.getApproverId(), timesheetId);
        }


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
