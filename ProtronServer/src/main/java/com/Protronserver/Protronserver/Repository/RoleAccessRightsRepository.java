package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.Role;
import com.Protronserver.Protronserver.Entities.RoleAccessRights;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoleAccessRightsRepository extends JpaRepository<RoleAccessRights, Long> {
    List<RoleAccessRights> findByRole(Role role);
    void deleteByRole(Role role);
}