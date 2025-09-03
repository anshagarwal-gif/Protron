package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.Project;
import com.Protronserver.Protronserver.Entities.Rida;
import com.Protronserver.Protronserver.ResultDTOs.RidaResultDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RidaRepository extends JpaRepository<Rida, Long> {

    @Query("""
        SELECT new com.Protronserver.Protronserver.ResultDTOs.RidaResultDTO(
            r.id, r.project.projectName, r.project.id, t.tenantName,
            r.meetingReference, r.itemDescription, r.type,
            r.raisedOn, r.raisedBy, r.owner, r.dateRaised, r.targetCloser, r.status, r.remarks
        )
        FROM Rida r
        JOIN r.project p
        JOIN Tenant t ON r.tenantId = t.tenantId
        WHERE p.projectId = :projectId
          AND r.endTimestamp IS NULL
    """)
    List<RidaResultDTO> findAllByProjectId(@Param("projectId") Long projectId);

    @Modifying
    @Query("UPDATE Rida r SET r.project = :newProject WHERE r.project = :oldProject")
    void updateProjectForRidas(Project oldProject, Project newProject);
}
