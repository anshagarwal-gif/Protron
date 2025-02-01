package com.protron.Protron.repository;

import com.protron.Protron.entities.Timesheet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TimesheetRepository extends JpaRepository<Timesheet, Long> {

    List<Timesheet> findByEmployeeEmployeeId(Long employeeId);

    List<Timesheet> findByStatus(String status);
}
