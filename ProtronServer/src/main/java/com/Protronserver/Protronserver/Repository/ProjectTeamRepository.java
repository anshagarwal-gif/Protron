package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.ProjectTeam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectTeamRepository extends JpaRepository<ProjectTeam, Long> {
    List<ProjectTeam> findByProjectProjectIdAndEndTimestampIsNull(Long projectId);
    Optional<ProjectTeam> findByProjectTeamIdAndEndTimestampIsNull(Long id);
}
