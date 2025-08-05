package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.DashboardRecords.UserCostCurrencyDTO;
import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.ResultDTOs.UserBasicDetailDTO;
import com.Protronserver.Protronserver.ResultDTOs.UserEditableProfileDTO;
import com.Protronserver.Protronserver.Utils.UserProfileJson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    List<User> findByFirstNameIgnoreCaseAndEndTimestampIsNull(String firstName);
    Optional<User> findByEmailAndEndTimestampIsNull(String email);
    Optional<User> findByEmpCodeAndEndTimestampIsNull(String empCode);
    boolean existsByEmail(String email);
    List<User> findByEndTimestampIsNull();
    Optional<User> findByUserIdAndEndTimestampIsNull(Long id);
    List<User> findByTenantTenantIdAndEndTimestampIsNull(Long id);

    @Query("SELECT new com.Protronserver.Protronserver.ResultDTOs.UserBasicDetailDTO(u.email, u.mobilePhone, r.roleName, t.tenantName, CONCAT(u.firstName, ' ', u.lastName), u.empCode) " +
            "FROM User u " +
            "JOIN u.role r " +
            "JOIN u.tenant t " +
            "WHERE u.email = :email AND u.endTimestamp IS NULL")
    Optional<UserBasicDetailDTO> findBasicDetailsByEmail(@Param("email") String email);

    @Query(value = """
    SELECT
        JSON_OBJECT(
            'photo', TO_BASE64(u.photo),
            'firstName', u.first_name,
            'middleName', u.middle_name,
            'lastName', u.last_name,
            'empCode', u.emp_code,
            'email', u.email,
            'dateOfJoining', u.date_of_joining,
            'mobilePhone', u.mobile_phone,
            'lanPhone', u.lan_phone,
            'unit', u.unit,
            'addressLine1', u.address_line1,
            'addressLine2', u.address_line2,
            'addressLine3', u.address_line3,
            'city', u.city,
            'state', u.state,
            'zipCode', u.zip_code,
            'country', u.country,
            'tenantName', t.tenant_name,
            'roleName', r.role_name,
            'projectTeams', COALESCE(
                  (
                      SELECT JSON_ARRAYAGG(JSON_OBJECT('projectName', p.project_name))
                      FROM project_team pt
                      JOIN projects p ON pt.project_id = p.project_id
                      WHERE pt.user_id = u.user_id AND pt.end_timestamp IS NULL
                  ),
                  CAST('[]' AS JSON) 
              ),
              'certificates', COALESCE(
                  (
                      SELECT JSON_ARRAYAGG(JSON_OBJECT('certificateName', c.certificate_name))
                      FROM certificates c
                      WHERE c.user_id = u.user_id
                  ),
                  CAST('[]' AS JSON) 
              )
        ) AS userProfileJson
    FROM
        users u
    LEFT JOIN
        tenant t ON u.tenant_id = t.tenant_id
    LEFT JOIN
        roles r ON u.role_id = r.role_id
    WHERE
        u.email = :email
    """, nativeQuery = true)
    UserProfileJson findUserProfileById(@Param("email") String email);

    @Query("SELECT new com.Protronserver.Protronserver.ResultDTOs.UserEditableProfileDTO(" +
            "u.firstName, u.middleName, u.lastName, u.mobilePhone, " +
            "u.addressLine1, u.addressLine2, u.addressLine3, u.city, " +
            "u.state, u.zipCode, u.country, u.cost,u.cost_time, u.unit) " +
            "FROM User u WHERE u.userId = :userId AND u.endTimestamp IS NULL")
    Optional<UserEditableProfileDTO> findEditableProfileByUserId(@Param("userId") Long userId);

    @Query(value = """
    SELECT u.cost, u.unit 
    FROM users u 
    WHERE u.user_id = :userId AND u.end_timestamp IS NULL
    """, nativeQuery = true)
    Optional<UserCostCurrencyDTO> findCostAndCurrencyByUserIdNative(@Param("userId") Long userId);


}
