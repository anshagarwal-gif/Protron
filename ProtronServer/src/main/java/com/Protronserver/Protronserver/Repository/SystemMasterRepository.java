package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.SystemMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemMasterRepository extends JpaRepository<SystemMaster, Integer> {

    /**
     * Find all systems by tenant ID
     */
    List<SystemMaster> findByTenant_TenantId(Long tenantId);

    /**
     * Find system by name and tenant ID
     */
    SystemMaster findBySystemNameAndTenant_TenantId(String systemName, Long tenantId);

    /**
     * Find systems by name containing the given text (case-insensitive) and tenant
     * ID
     */
    @Query("SELECT s FROM SystemMaster s WHERE LOWER(s.systemName) LIKE LOWER(CONCAT('%', :systemName, '%')) AND s.tenant.tenantId = :tenantId")
    List<SystemMaster> findBySystemNameContainingIgnoreCaseAndTenantId(@Param("systemName") String systemName,
            @Param("tenantId") Long tenantId);
}
