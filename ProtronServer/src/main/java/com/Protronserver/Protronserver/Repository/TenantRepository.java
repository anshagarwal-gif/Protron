package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.Tenant;
import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.ResultDTOs.TeamTableResultDTO;
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

    @Query("SELECT DISTINCT u FROM User u " +
            "LEFT JOIN FETCH u.role r " +
            "JOIN FETCH u.tenant t " +
            "LEFT JOIN FETCH u.userAccessRights ar " +
            "WHERE u.tenant.tenantId = :tenantId AND u.endTimestamp IS NULL")
    List<User> getUsersWithRoleAndAccessRightsByTenantId(@Param("tenantId") Long tenantId);

}
