package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.Project;
import com.Protronserver.Protronserver.Entities.ProjectTeam;
import com.Protronserver.Protronserver.ResultDTOs.ActiveProjectsDTO;
import com.Protronserver.Protronserver.ResultDTOs.ProjectDetailsDTO;
import com.Protronserver.Protronserver.ResultDTOs.SystemImpactedDTO;
import com.Protronserver.Protronserver.ResultDTOs.TeamMemberDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("SELECT COALESCE(MAX(p.projectId), 0) + 1 FROM Project p")
    Long getNextSeriesId();

    Optional<Project> findByProjectIdAndEndTimestampIsNull(Long id);
    List<Project> findByEndTimestampIsNull();
    List<Project> findByTenantTenantIdAndEndTimestampIsNull(Long id);

    @Query(value = """
    SELECT p.project_Id, p.project_name
    FROM projects p
    JOIN project_team pt ON p.project_id = pt.project_id
    JOIN users u ON pt.user_id = u.user_id
    WHERE pt.user_id = :userId
      AND pt.status = 'active'
      AND p.tenant_id = u.tenant_id
      AND p.end_timestamp IS NULL
      AND pt.end_timestamp IS NULL
""", nativeQuery = true)
    List<ActiveProjectsDTO> findActiveProjectsByUserInSameTenant(@Param("userId") Long userId);

    @Query("SELECT new com.Protronserver.Protronserver.ResultDTOs.ProjectDetailsDTO(" +
            "p.projectCode, p.projectId, p.projectName, t.tenantName, p.startDate, p.endDate, p.unit, p.projectCost, " +
            "p.startTimestamp, p.projectIcon, " +
            "pm.userId, CONCAT(pm.firstName, ' ', pm.lastName), pm.empCode, " +
            "s.userId, CONCAT(s.firstName, ' ', s.lastName), s.empCode, " +
            "p.productOwner, p.scrumMaster, p.architect, p.chiefScrumMaster, " +
            "p.deliveryLeader, p.businessUnitFundedBy, p.businessUnitDeliveredTo, p.priority, p.defineDone" +
            ") " +
            "FROM Project p " +
            "LEFT JOIN p.tenant t " +
            "LEFT JOIN p.projectManager pm " +
            "LEFT JOIN p.sponsor s " +
            "WHERE p.projectId = :projectId")
    Optional<ProjectDetailsDTO> fetchProjectDetails(@Param("projectId") Long projectId);


    @Query("SELECT new com.Protronserver.Protronserver.ResultDTOs.TeamMemberDTO(" +
            "pt.user.userId, CONCAT(pt.user.firstName, ' ', pt.user.lastName), pt.empCode, pt.project.projectId) " +
            "FROM ProjectTeam pt WHERE pt.project.projectId = :projectId AND pt.endTimestamp IS NULL")
    List<TeamMemberDTO> getTeamMembersForProject(@Param("projectId") Long projectId);

    @Query("SELECT new com.Protronserver.Protronserver.ResultDTOs.SystemImpactedDTO(" +
            "si.systemId, si.systemName, si.project.projectId) " +
            "FROM Systemimpacted si WHERE si.project.projectId = :projectId AND si.endTimestamp IS NULL")
    List<SystemImpactedDTO> getSystemsForProject(@Param("projectId") Long projectId);


}
