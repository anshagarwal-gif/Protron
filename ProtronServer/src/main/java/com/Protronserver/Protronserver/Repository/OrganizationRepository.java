package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Integer> {

    /**
     * Find all organizations by tenant ID
     */
    List<Organization> findByTenant_TenantId(Long tenantId);

    /**
     * Find organization by name and tenant ID
     */
    Organization findByOrgNameAndTenant_TenantId(String orgName, Long tenantId);

    /**
     * Find organizations by name containing the given text (case-insensitive) and
     * tenant ID
     */
    @Query("SELECT o FROM Organization o WHERE LOWER(o.orgName) LIKE LOWER(CONCAT('%', :orgName, '%')) AND o.tenant.tenantId = :tenantId")
    List<Organization> findByOrgNameContainingIgnoreCaseAndTenantId(@Param("orgName") String orgName,
            @Param("tenantId") Long tenantId);

    /**
     * Find organizations by type and tenant ID
     */
    List<Organization> findByOrgTypeAndTenant_TenantId(String orgType, Long tenantId);

    /**
     * Find organizations by type containing the given text (case-insensitive) and
     * tenant ID
     */
    @Query("SELECT o FROM Organization o WHERE LOWER(o.orgType) LIKE LOWER(CONCAT('%', :orgType, '%')) AND o.tenant.tenantId = :tenantId")
    List<Organization> findByOrgTypeContainingIgnoreCaseAndTenantId(@Param("orgType") String orgType,
            @Param("tenantId") Long tenantId);
}

