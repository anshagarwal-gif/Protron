package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.TaskAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskAttachmentRepository extends JpaRepository<TaskAttachment, Long> {
    List<TaskAttachment> findByTaskId(String taskId);

    // Check if table exists
    @Query(value = "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'task_attachment'", nativeQuery = true)
    Integer checkTableExists();

    // Alternative query using native SQL as a fallback
    @Query(value = "SELECT * FROM task_attachment WHERE task_id = :taskId", nativeQuery = true)
    List<TaskAttachment> findByTaskIdNative(@Param("taskId") String taskId);

    // Generic query to check table structure
    @Query(value = "SHOW TABLES LIKE 'task_attachment'", nativeQuery = true)
    List<String> checkTableName();
}
