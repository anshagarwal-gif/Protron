package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RolesRepository extends JpaRepository<Role, Long> {
    Role findByRoleName(String roleName);
    Optional<Role> findByRoleId(Long roleId);
}
