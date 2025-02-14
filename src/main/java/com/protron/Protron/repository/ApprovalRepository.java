package com.protron.Protron.repository;

import com.protron.Protron.entities.Approval;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ApprovalRepository extends JpaRepository<Approval, Long> {

    List<Approval> findByApproverApproverId(Long approverId);
    List<Approval> findByTimesheetTimesheetId(Long timesheetId);

    List<Approval> findByTimesheet_TimesheetId(Long timesheetId);
    Optional<Approval> findByTimesheetTimesheetIdAndApproverEmail(Long timesheetId, String approverEmail);
}
