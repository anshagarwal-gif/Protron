package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RolesRepository extends JpaRepository<Role, Long> {
    Role findByRoleNameAndTenant_TenantId(String roleName, Long tenantId);
    Role findByRoleName(String roleName);
    Optional<Role> findByRoleIdAndTenant_TenantId(Long roleId, Long tenantId);
    Optional<Role> findByRoleId(Long roleId);
    List<Role> findByTenant_TenantId(Long tenantId);
}
