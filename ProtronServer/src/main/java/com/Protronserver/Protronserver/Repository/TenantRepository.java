package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.Tenant;
import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.Entities.UserAccessRights;
import com.Protronserver.Protronserver.ResultDTOs.ProjectTableDTO;
import com.Protronserver.Protronserver.ResultDTOs.TeamTableResultDTO;
import com.Protronserver.Protronserver.ResultDTOs.UsersTableResultDTO;
import com.Protronserver.Protronserver.Utils.QueryResponseJsonString;
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

    @Query(
            value = """
    SELECT
        COALESCE(JSON_ARRAYAGG(user_json), JSON_ARRAY()) AS "jsonPayload"
    FROM (
        SELECT
            JSON_OBJECT(
                'userId', u.user_id, 'name', CONCAT(u.first_name, u.last_name), 'email', u.email, 'mobilePhone', u.mobile_phone, 'city', u.city, 'country', u.country, 'status', u.status, 'tenantName', t.tenant_name,
                'role', (
                    SELECT JSON_OBJECT(
                        'roleId', r.role_id, 'roleName', r.role_name,
                        'roleAccessRights', (
                            SELECT COALESCE(JSON_ARRAYAGG(
                                JSON_OBJECT('roleAccessRightsId', rar.role_access_rights_id, 'accessRight', JSON_OBJECT('accessId', ar.access_id, 'moduleName', ar.module_name, 'canView', (CASE WHEN ar.can_view = 1 THEN true ELSE false END), 'canEdit', (CASE WHEN ar.can_edit = 1 THEN true ELSE false END), 'canDelete', (CASE WHEN ar.can_delete = 1 THEN true ELSE false END)))
                            ), JSON_ARRAY())
                            FROM role_access_rights rar JOIN access_rights ar ON rar.access_id = ar.access_id WHERE rar.role_id = r.role_id
                        ),
                        'tenant', (
                             SELECT JSON_OBJECT('tenantId', rt.tenant_id, 'tenantName', rt.tenant_name, 'tenantContactName', rt.tenant_contact_name, 'tenantContactEmail', rt.tenant_contact_email, 'tenantContactDesc', rt.tenant_contact_desc, 'tenantContactPhone', rt.tenant_contact_phone, 'tenantAddressLine1', rt.tenant_address_line1, 'tenantAddressLine2', rt.tenant_address_line2, 'tenantAddressLine3', rt.tenant_address_line3, 'tenantAddressPostalCode', rt.tenant_address_postal_code)
                             FROM tenant rt WHERE rt.tenant_id = r.tenant_id
                        )
                    ) FROM roles r WHERE r.role_id = u.role_id
                ),
                'userAccessRights', (
                    SELECT COALESCE(JSON_ARRAYAGG(
                       JSON_OBJECT('userAccessRightsId', uar.user_access_rights_id, 'accessRight', JSON_OBJECT('accessId', ar.access_id, 'moduleName', ar.module_name, 'canView', (CASE WHEN ar.can_view = 1 THEN true ELSE false END), 'canEdit', (CASE WHEN ar.can_edit = 1 THEN true ELSE false END), 'canDelete', (CASE WHEN ar.can_delete = 1 THEN true ELSE false END)))
                    ), JSON_ARRAY())
                    FROM user_access_rights uar JOIN access_rights ar ON uar.access_id = ar.access_id WHERE uar.user_id = u.user_id
                )
            ) as user_json
        FROM
            users u
        LEFT JOIN
            tenant t ON u.tenant_id = t.tenant_id 
        WHERE
            u.tenant_id = :tenantId
        ORDER BY u.user_id
    ) AS paginated_users;
    """,
            nativeQuery = true
    )
    QueryResponseJsonString findAllUsersAsJson(
            @Param("tenantId") Long tenantId
    );


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
