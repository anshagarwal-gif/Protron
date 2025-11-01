package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.ProjectTeam;
import com.Protronserver.Protronserver.ResultDTOs.ProjectTeamMemberDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectTeamRepository extends JpaRepository<ProjectTeam, Long> {
    List<ProjectTeam> findByProjectProjectIdAndEndTimestampIsNull(Long projectId);
    Optional<ProjectTeam> findByProjectTeamIdAndEndTimestampIsNull(Long id);

    @Query("SELECT pt FROM ProjectTeam pt WHERE pt.project.projectId = :projectId AND (pt.endTimestamp IS NULL OR pt.status = 'removed')")
    List<ProjectTeam> findActiveOrRemovedByProjectId(Long projectId);
    List<ProjectTeam> findBySystemimpacted_SystemId(Long systemId);
    List<ProjectTeam> findByUser_UserIdAndEndTimestampIsNull(Long userId);

    @Query("SELECT new com.Protronserver.Protronserver.ResultDTOs.ProjectTeamMemberDTO(" +
            "pt.projectTeamId, u.userId, CONCAT(u.firstName, ' ', u.lastName), pt.empCode, u.email, " +
            "pt.unit, pt.pricing, pt.pricingType, si.systemId, si.systemName, pt.estimatedReleaseDate, pt.onBoardingDate, pt.status, pt.startTimestamp) " +
            "FROM ProjectTeam pt " +
            "JOIN pt.user u " +
            "LEFT JOIN pt.systemimpacted si " +
            "WHERE pt.project.projectId = :projectId AND pt.endTimestamp IS NULL")
    List<ProjectTeamMemberDTO> getTeamMemberDTOByProjectId(@Param("projectId") Long projectId);


}
