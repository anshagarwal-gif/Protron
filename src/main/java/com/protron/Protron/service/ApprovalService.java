package com.protron.Protron.service;

import com.protron.Protron.Dto.ApprovalDTO;
import com.protron.Protron.entities.Approval;
import com.protron.Protron.entities.Approver;
import com.protron.Protron.entities.Timesheet;
import com.protron.Protron.repository.ApprovalRepository;
import com.protron.Protron.repository.ApproverRepository;
import com.protron.Protron.repository.TimesheetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ApprovalService {

    @Autowired
    private final ApprovalRepository approvalRepository;
    @Autowired
    private ApproverRepository approverRepository;
    @Autowired
    private TimesheetRepository timesheetRepository;

    public ApprovalService(ApprovalRepository approvalRepository) {
        this.approvalRepository = approvalRepository;
    }

    public Approval addApproval(Long approverId , Long timesheetId) {
        Approver approver = approverRepository.findById(approverId)
            .orElseThrow(()-> new RuntimeException("Approver Not Found"));
        Timesheet timesheet = timesheetRepository.findById(timesheetId)
                .orElseThrow(()-> new RuntimeException("Timesheet Not Found"));

        Approval approval = new Approval();
        approval.setApprover(approver);
        approval.setTimesheet(timesheet);

        return approvalRepository.save(approval);
    }

    public List<Approval> getAllApprovals() {
        return approvalRepository.findAll();
    }

    public Optional<Approval> getApprovalById(Long id) {
        return approvalRepository.findById(id);
    }

    public List<Approval> getApprovalsByApproverId(Long approverId) {
        return approvalRepository.findByApproverApproverId(approverId);
    }

    public List<ApprovalDTO> getApprovalsByTimesheetId(Long timesheetId) {
        List<Approval> approvals = approvalRepository.findByTimesheet_TimesheetId(timesheetId);

        return approvals.stream()
                .map(approval -> new ApprovalDTO(
                        approval.getApprover().getApproverId(),
                        approval.getApprover().getEmail(),  // Assuming `Approver` entity has a name field
                        approval.getStatus(),
                        approval.getReason()
                ))
                .collect(Collectors.toList());
    }

    public List<Approver> getApproversByTimesheetId(Long timesheetId) {
        List<Approval> approvals = approvalRepository.findByTimesheet_TimesheetId(timesheetId);
        return approvals.stream()
                .map(Approval::getApprover)
                .collect(Collectors.toList());
    }

    public String updateApprovalStatus(Long timesheetId, String approverEmail, String status, String reason) {
        Timesheet timesheet = timesheetRepository.findById(timesheetId)
                .orElseThrow(() -> new RuntimeException("Timesheet not found"));

        Approval approval = approvalRepository.findByTimesheetTimesheetIdAndApproverEmail(timesheetId, approverEmail)
                .orElseThrow(() -> new RuntimeException("Approval entry not found for this approver"));

        approval.setStatus(status);

        if ("Rejected".equalsIgnoreCase(status)) {
            approval.setReason(reason); // Store the reason if status is Rejected
        } else {
            approval.setReason("NA"); // Clear reason if status is not Rejected
        }

        approvalRepository.save(approval);

        List<Approval> approvals = approvalRepository.findByTimesheet_TimesheetId(timesheetId);

        boolean allApproved = approvals.stream().allMatch(a -> a.getStatus().equals("Approved"));
        boolean anyRejected = approvals.stream().anyMatch(a -> a.getStatus().equals("Rejected"));

        if (anyRejected) {
            timesheet.setStatus("Rejected");
        } else if (allApproved) {
            timesheet.setStatus("Approved");
        }

        timesheetRepository.save(timesheet);

        return "Approval Updated, Timesheet Status: " + timesheet.getStatus();
    }
}
