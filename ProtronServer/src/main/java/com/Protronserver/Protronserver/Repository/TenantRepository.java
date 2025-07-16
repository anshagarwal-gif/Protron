package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.Tenant;
import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.Entities.UserAccessRights;
import com.Protronserver.Protronserver.ResultDTOs.ProjectTableDTO;
import com.Protronserver.Protronserver.ResultDTOs.TeamTableResultDTO;
import com.Protronserver.Protronserver.ResultDTOs.UsersTableResultDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {

    @Query("SELECT new com.Protronserver.Protronserver.ResultDTOs.TeamTableResultDTO(" +
            "u.userId, CONCAT(u.firstName, ' ', u.lastName), u.empCode, u.email, u.mobilePhone, " +
            "u.city, u.state, u.country, u.cost, u.dateOfJoining, u.status) " +
            "FROM User u " +
            "WHERE u.tenant.tenantId = :tenantId AND u.endTimestamp IS NULL")
    List<TeamTableResultDTO> getTeamUsersByTenant(@Param("tenantId") Long tenantId);

    @Query("SELECT new com.Protronserver.Protronserver.ResultDTOs.UsersTableResultDTO(" +
            "u.userId, CONCAT(u.firstName, ' ', u.lastName), u.email, u.mobilePhone, " +
            "u.city, u.country, u.status, t.tenantName, r) " +
            "FROM User u " +
            "JOIN u.tenant t " +
            "LEFT JOIN u.role r " +
            "WHERE u.tenant.tenantId = :tenantId AND u.endTimestamp IS NULL")
    List<UsersTableResultDTO> getUsersBasicDataByTenantId(@Param("tenantId") Long tenantId);


    @Query("SELECT ar FROM UserAccessRights ar WHERE ar.user.userId IN :userIds")
    List<UserAccessRights> findAccessRightsByUserIds(@Param("userIds") List<Long> userIds);

    @Query("SELECT new com.Protronserver.Protronserver.ResultDTOs.ProjectTableDTO(" +
            "p.projectId, p.projectName, p.startDate, " +
            "pm.userId, CONCAT(pm.firstName, ' ', pm.lastName), " +
            "s.userId, CONCAT(s.firstName, ' ', s.lastName), " +
            "p.unit, p.projectCost, SIZE(p.projectTeam)) " +
            "FROM Project p " +
            "LEFT JOIN p.projectManager pm " +
            "LEFT JOIN p.sponsor s " +
            "WHERE p.endTimestamp IS NULL AND p.tenant.tenantId = :tenantId")
    List<ProjectTableDTO> getProjectTableData(@Param("tenantId") Long tenantId);

}
