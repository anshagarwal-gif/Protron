package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.TimesheetTaskAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface TimesheetTaskAttachmentRepository extends JpaRepository<TimesheetTaskAttachment, Long> {

    /**
     * Find all attachments for a specific timesheet task
     */
    List<TimesheetTaskAttachment> findByTimesheetTaskTaskId(Long taskId);

    /**
     * Delete all attachments for a specific timesheet task
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM TimesheetTaskAttachment a WHERE a.timesheetTask.taskId = :taskId")
    void deleteByTimesheetTaskTaskId(@Param("taskId") Long taskId);

    /**
     * Count attachments for a specific task
     */
    long countByTimesheetTaskTaskId(Long taskId);

    /**
     * Find attachments by file name for a specific task
     */
    List<TimesheetTaskAttachment> findByTimesheetTaskTaskIdAndFileName(Long taskId, String fileName);

    /**
     * Find attachments by file type for a specific task
     */
    List<TimesheetTaskAttachment> findByTimesheetTaskTaskIdAndFileType(Long taskId, String fileType);

    /**
     * Get total file size for all attachments of a task
     */
    @Query("SELECT COALESCE(SUM(a.fileSize), 0) FROM TimesheetTaskAttachment a WHERE a.timesheetTask.taskId = :taskId")
    Long getTotalFileSizeByTaskId(@Param("taskId") Long taskId);

    /**
     * Find all attachments for tasks within a date range for a specific user
     */
    @Query("SELECT a FROM TimesheetTaskAttachment a WHERE a.timesheetTask.user.userId = :userId " +
            "AND a.timesheetTask.date BETWEEN :startDate AND :endDate " +
            "AND a.timesheetTask.endTimestamp IS NULL")
    List<TimesheetTaskAttachment> findAttachmentsByUserAndDateRange(
            @Param("userId") Long userId,
            @Param("startDate") java.util.Date startDate,
            @Param("endDate") java.util.Date endDate);

    /**
     * Check if a task has any attachments
     */
    boolean existsByTimesheetTaskTaskId(Long taskId);

    /**
     * Delete attachments older than a certain file size (for cleanup)
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM TimesheetTaskAttachment a WHERE a.fileSize > :maxSize")
    void deleteAttachmentsLargerThan(@Param("maxSize") Long maxSize);
}
