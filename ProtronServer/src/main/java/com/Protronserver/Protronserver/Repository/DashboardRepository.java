package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.DashboardRecords.ProjectTeamCountDTO;
import com.Protronserver.Protronserver.DashboardRecords.ProjectValueDTO;
import com.Protronserver.Protronserver.Entities.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DashboardRepository extends JpaRepository<Project, Long> {

    @Query(value = """
        SELECT COUNT(*) 
        FROM projects 
        WHERE tenant_id = :tenantId AND end_timestamp IS NULL
    """, nativeQuery = true)
    int getTotalProjects(@Param("tenantId") Long tenantId);

    @Query(value = """
        SELECT COUNT(*) 
        FROM projects 
        WHERE start_date > CURRENT_DATE AND tenant_id = :tenantId AND end_timestamp IS NULL
    """, nativeQuery = true)
    int getOpenProjects(@Param("tenantId") Long tenantId);

    @Query(value = """
        SELECT COUNT(*) 
        FROM projects 
        WHERE start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE 
          AND tenant_id = :tenantId AND end_timestamp IS NULL
    """, nativeQuery = true)
    int getWIPProjects(@Param("tenantId") Long tenantId);

    @Query(value = """
        SELECT COUNT(*) 
        FROM projects 
        WHERE end_date < CURRENT_DATE AND tenant_id = :tenantId AND end_timestamp IS NULL
    """, nativeQuery = true)
    int getClosedProjects(@Param("tenantId") Long tenantId);

    @Query(value = """
        SELECT 
            p.project_id AS projectId,
            p.project_name AS projectName,
            COUNT(pt.project_team_id) AS memberCount
        FROM projects p
        JOIN project_team pt ON pt.project_id = p.project_id
        WHERE p.tenant_id = :tenantId AND p.end_timestamp IS NULL AND pt.end_timestamp IS NULL
        GROUP BY p.project_id, p.project_name
        ORDER BY p.start_date DESC
    """, nativeQuery = true)
    List<ProjectTeamCountDTO> getTopProjectsTeamCount(@Param("tenantId") Long tenantId);

    @Query(value = """
        SELECT 
            p.project_id AS projectId,
            p.project_name AS projectName,
            p.project_cost AS projectCost
        FROM projects p
        WHERE p.tenant_id = :tenantId AND p.end_timestamp IS NULL
        ORDER BY p.start_date DESC
    """, nativeQuery = true)
    List<ProjectValueDTO> getTopProjectValues(@Param("tenantId") Long tenantId);
}
