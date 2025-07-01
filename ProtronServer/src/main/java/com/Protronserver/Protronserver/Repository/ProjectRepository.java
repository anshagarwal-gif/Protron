package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.Project;
import com.Protronserver.Protronserver.Entities.ProjectTeam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    Optional<Project> findByProjectIdAndEndTimestampIsNull(Long id);
    List<Project> findByEndTimestampIsNull();
    List<Project> findByTenantTenantIdAndEndTimestampIsNull(Long id);

    @Query(value = """
    SELECT p.*
    FROM projects p
    JOIN project_team pt ON p.project_id = pt.project_id
    JOIN users u ON pt.user_id = u.user_id
    WHERE pt.user_id = :userId
      AND pt.status = 'active'
      AND p.tenant_id = u.tenant_id
      AND p.end_timestamp IS NULL
      AND pt.end_timestamp IS NULL
""", nativeQuery = true)
    List<Project> findActiveProjectsByUserInSameTenant(@Param("userId") Long userId);

}
