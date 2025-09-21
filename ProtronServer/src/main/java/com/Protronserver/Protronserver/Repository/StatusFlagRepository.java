package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.StatusFlag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StatusFlagRepository extends JpaRepository<StatusFlag, Integer> {

    // Find all status flags by status type
    List<StatusFlag> findByStatusType(String statusType);

    // Find all status flags by status type and tenant
    @Query("SELECT sf FROM StatusFlag sf WHERE sf.statusType = :statusType AND sf.tenant.tenantId = :tenantId")
    List<StatusFlag> findByStatusTypeAndTenantId(@Param("statusType") String statusType,
            @Param("tenantId") Long tenantId);

    // Find all distinct status types
    @Query("SELECT DISTINCT sf.statusType FROM StatusFlag sf")
    List<String> findDistinctStatusTypes();

    // Find all status flags by tenant
    @Query("SELECT sf FROM StatusFlag sf WHERE sf.tenant.tenantId = :tenantId")
    List<StatusFlag> findByTenantId(@Param("tenantId") Long tenantId);
}
