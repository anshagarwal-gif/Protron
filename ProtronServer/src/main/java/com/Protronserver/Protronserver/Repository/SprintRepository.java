package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, Long> {
    List<Sprint> findAllByProjectIdAndEndTimestampIsNull(Long projectId);

    @Modifying
    @Query("UPDATE Sprint s SET s.projectId = :newProjectId WHERE s.projectId = :oldProjectId")
    void updateProjectForSprints(Long oldProjectId, Long newProjectId);

    boolean existsBySprintId(Long sprintId);
}
