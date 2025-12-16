package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.TimesheetTask;
import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.ResultDTOs.TimesheetTaskDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Date;
import java.util.List;

public interface TimesheetTaskRepository extends JpaRepository<TimesheetTask, Long> {
    List<TimesheetTask> findByDateBetweenAndUserAndEndTimestampIsNull(Date startDate, Date endDate, User user);
    List<TimesheetTask> findByDateBetweenAndUserAndIsSubmittedFalseAndEndTimestampIsNull(Date start, Date end, User user);
    List<TimesheetTask> findByDateBetweenAndUserAndIsSubmittedTrueAndEndTimestampIsNull(Date start, Date end, User user);

    @Query("SELECT new com.Protronserver.Protronserver.ResultDTOs.TimesheetTaskDTO(" +
            "t.taskId, t.taskType, t.date, p.projectName, p.projectId, t.hoursSpent, t.minutesSpent, t.remainingHours, t.remainingMinutes, t.taskTopic, t.description, t.isSubmitted) " +
            "FROM TimesheetTask t " +
            "JOIN t.project p " +
            "WHERE t.date >= :startDateTime\n" +
            "  AND t.date < :endDateTime\n" +
            "  AND t.user.userId = :userId\n" +
            "  AND t.endTimestamp IS NULL")
    List<TimesheetTaskDTO> findTaskDTOsBetweenDates(
            @Param("startDateTime") Date startDateTime,
            @Param("endDateTime") Date endDateTime,
            @Param("userId") Long userId
    );

    TimesheetTask findByTaskRefAndEndTimestampIsNull(Long id);

}
