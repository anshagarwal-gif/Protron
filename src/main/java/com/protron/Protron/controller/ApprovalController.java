package com.protron.Protron.controller;

import com.protron.Protron.Dto.ApprovalDTO;
import com.protron.Protron.entities.Approval;
import com.protron.Protron.entities.Approver;
import com.protron.Protron.service.ApprovalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/approvals")
public class ApprovalController {

    private final ApprovalService approvalService;

    public ApprovalController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @PostMapping("/newApproval")
    public ResponseEntity<Approval> addApproval(
            @RequestParam Long approverId,
            @RequestParam Long timesheetId) {
        return ResponseEntity.ok(approvalService.addApproval(approverId, timesheetId));
    }

    @GetMapping("/getAllApprovals")
    public ResponseEntity<List<Approval>> getAllApprovals() {
        return ResponseEntity.ok(approvalService.getAllApprovals());
    }

    @GetMapping("/getApproval/{id}")
    public ResponseEntity<Approval> getApprovalById(@PathVariable Long id) {
        Optional<Approval> approval = approvalService.getApprovalById(id);
        return approval.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/getApprovalByApproverId")
    public ResponseEntity<List<Approval>> getApprovalByApproverId(@RequestParam Long approverId) {
        List<Approval> approvals = approvalService.getApprovalsByApproverId(approverId);
        return approvals.isEmpty() ? ResponseEntity.notFound().build() : ResponseEntity.ok(approvals);
    }

    @GetMapping("/getApprovalByTimesheetId")
    public ResponseEntity<List<ApprovalDTO>> getApprovalsByTimesheetId(@RequestParam Long timesheetId) {
        List<ApprovalDTO> approvals = approvalService.getApprovalsByTimesheetId(timesheetId);
        return approvals.isEmpty() ? ResponseEntity.notFound().build() : ResponseEntity.ok(approvals);
    }

    @GetMapping("/timesheet/{timesheetId}/approvers")
    public List<Approver> getApproversByTimesheet(@PathVariable Long timesheetId) {
        return approvalService.getApproversByTimesheetId(timesheetId);
    }
}
