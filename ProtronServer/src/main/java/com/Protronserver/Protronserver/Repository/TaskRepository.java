package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    Optional<Task> findByTaskId(String taskId);

    List<Task> findByTenantIdAndParentIdAndEndTimestampIsNull(Long tenantId, String parentId);

}
