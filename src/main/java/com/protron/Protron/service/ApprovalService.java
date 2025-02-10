package com.protron.Protron.service;

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

    public List<Approval> getApprovalsByTimesheetId(Long timesheetId) {
        return approvalRepository.findByTimesheetTimesheetId(timesheetId);
    }

    public List<Approver> getApproversByTimesheetId(Long timesheetId) {
        List<Approval> approvals = approvalRepository.findByTimesheet_TimesheetId(timesheetId);
        return approvals.stream()
                .map(Approval::getApprover)
                .collect(Collectors.toList());
    }
}
