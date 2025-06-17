package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.TimesheetTask;
import com.Protronserver.Protronserver.Entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Date;
import java.util.List;

public interface TimesheetTaskRepository extends JpaRepository<TimesheetTask, Long> {
    List<TimesheetTask> findByDateBetweenAndUser(Date startDate, Date endDate, User user);
}
