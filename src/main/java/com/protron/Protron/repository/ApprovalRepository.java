package com.protron.Protron.repository;

import com.protron.Protron.entities.Approval;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApprovalRepository extends JpaRepository<Approval, Long> {

    List<Approval> findByApproverApproverId(Long approverId);
    List<Approval> findByTimesheetTimesheetId(Long timesheetId);

}
