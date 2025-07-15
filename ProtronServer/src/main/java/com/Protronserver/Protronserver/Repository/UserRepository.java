package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.ResultDTOs.UserBasicDetailDTO;
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

}
