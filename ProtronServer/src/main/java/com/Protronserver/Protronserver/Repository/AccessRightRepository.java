package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.AccessRight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccessRightRepository extends JpaRepository<AccessRight, Long> {
    Optional<AccessRight> findByModuleNameAndCanViewAndCanEditAndCanDeleteAndTenant_TenantId(
            String moduleName, boolean canView, boolean canEdit, boolean canDelete, Long tenantId);
}
