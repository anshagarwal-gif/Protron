package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.Project;
import com.Protronserver.Protronserver.Entities.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    Optional<Task> findByTaskIdAndEndTimestampIsNull(String taskId);

    List<Task> findByTenantIdAndParentIdAndEndTimestampIsNull(Long tenantId, String parentId);

    @Modifying
    @Query("UPDATE Task t SET t.projectId = :newProjectId WHERE t.projectId = :oldProjectId")
    void updateProjectForTasks(Long oldProjectId, Long newProjectId);

}
