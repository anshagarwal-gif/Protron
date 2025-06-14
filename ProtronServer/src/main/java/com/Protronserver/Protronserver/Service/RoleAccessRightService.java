package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.AccessRightDTO;
import com.Protronserver.Protronserver.Entities.*;
import com.Protronserver.Protronserver.Repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RoleAccessRightService {

    @Autowired
    private AccessRightRepository accessRightRepository;

    @Autowired
    private RoleAccessRightsRepository roleAccessRightsRepository;

    @Autowired
    private UserAccessRightsRepository userAccessRightsRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RolesRepository rolesRepository;

    @Autowired
    private TenantRepository tenantRepository;

    private Long checkEditUserAccessPermission() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (!(principal instanceof User loggedInUser)) {
            throw new RuntimeException("Unauthorized access");
        }

        Role existingRole = loggedInUser.getRole();
        boolean isTenantAdmin = "tenant_admin".equals(existingRole.getRoleName());

        boolean hasEditAccessToUsers = roleAccessRightsRepository.findByRole(existingRole).stream()
                .anyMatch(rar -> "users".equals(rar.getAccessRight().getModuleName()) &&
                        rar.getAccessRight().isCanEdit());

        if (!isTenantAdmin && !hasEditAccessToUsers) {
            throw new RuntimeException("You do not have permission to edit user access rights");
        }

        return loggedInUser.getTenant().getTenantId();
    }

    @Transactional
    public void updateUserAccessRights(Long tenantId, Long userIdToUpdate, List<AccessRightDTO> updatedAccessRights) {
        // Only called internally after permission check
        User userToUpdate = userRepository.findById(userIdToUpdate)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Role role = userToUpdate.getRole();

        List<AccessRight> roleRights = roleAccessRightsRepository.findByRole(role).stream()
                .map(RoleAccessRights::getAccessRight)
                .toList();

        Map<String, AccessRight> roleMap = roleRights.stream()
                .collect(Collectors.toMap(AccessRight::getModuleName, ar -> ar));

        userAccessRightsRepository.deleteByUser(userToUpdate);

        for (AccessRightDTO dto : updatedAccessRights) {
            AccessRight roleAR = roleMap.get(dto.getModuleName());

            boolean isDiff = roleAR == null ||
                    roleAR.isCanView() != dto.isCanView() ||
                    roleAR.isCanEdit() != dto.isCanEdit() ||
                    roleAR.isCanDelete() != dto.isCanDelete();

            if (isDiff) {
                Optional<AccessRight> existing = accessRightRepository.findByModuleNameAndCanViewAndCanEditAndCanDeleteAndTenant_TenantId(
                        dto.getModuleName(), dto.isCanView(), dto.isCanEdit(), dto.isCanDelete(), tenantId);

                AccessRight accessRight = existing.orElseGet(() -> {
                    AccessRight newAr = new AccessRight();
                    newAr.setModuleName(dto.getModuleName());
                    newAr.setCanView(dto.isCanView());
                    newAr.setCanEdit(dto.isCanEdit());
                    newAr.setCanDelete(dto.isCanDelete());
                    Tenant existingTenant = tenantRepository.findById(tenantId)
                            .orElseThrow(()-> new RuntimeException("Tenant Not found..!!"));
                    newAr.setTenant(existingTenant);
                    return accessRightRepository.save(newAr);
                });

                UserAccessRights userAR = new UserAccessRights(userToUpdate, accessRight);
                userAccessRightsRepository.save(userAR);
            }
        }
    }

    @Transactional
    public void updateRoleAndAccess(Long userIdToUpdate, Long roleId, List<AccessRightDTO> updatedAccessRights) {
        Long tenantId = checkEditUserAccessPermission();

        User userToUpdate = userRepository.findById(userIdToUpdate)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (userToUpdate.getRole() == null || !userToUpdate.getRole().getRoleId().equals(roleId)) {
            Role role = rolesRepository.findByRoleIdAndTenant_TenantId(roleId, tenantId)
                    .orElseThrow(() -> new RuntimeException("Role Not Found"));
            userToUpdate.setRole(role);
            userRepository.save(userToUpdate);
        }

        updateUserAccessRights(tenantId, userIdToUpdate, updatedAccessRights);
    }

    public List<Role> getRoles(){
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (!(principal instanceof User loggedInUser)) {
            throw new RuntimeException("Unauthorized access");
        }

        return rolesRepository.findByTenant_TenantId(loggedInUser.getTenant().getTenantId());
    }

    @Transactional
    public void updateRoleAccessRights(Long roleId, List<AccessRightDTO> updatedRoleAccess) {
        Long tenantId = checkEditUserAccessPermission();

        Role existingRole = rolesRepository.findByRoleIdAndTenant_TenantId(roleId, tenantId)
                .orElseThrow(() -> new RuntimeException("Role: " + roleId + " Not found"));

        // Remove existing access rights for the role
        roleAccessRightsRepository.deleteByRole(existingRole);

        for (AccessRightDTO dto : updatedRoleAccess) {
            // Try to find an existing access right with the same properties
            Optional<AccessRight> existingAccessRight = accessRightRepository
                    .findByModuleNameAndCanViewAndCanEditAndCanDeleteAndTenant_TenantId(
                            dto.getModuleName(),
                            dto.isCanView(),
                            dto.isCanEdit(),
                            dto.isCanDelete(),
                            tenantId);

            // If not found, create and save a new one
            AccessRight accessRight = existingAccessRight.orElseGet(() -> {
                AccessRight newAccessRight = new AccessRight();
                newAccessRight.setModuleName(dto.getModuleName());
                newAccessRight.setCanView(dto.isCanView());
                newAccessRight.setCanEdit(dto.isCanEdit());
                newAccessRight.setCanDelete(dto.isCanDelete());
                Tenant existingTenant = tenantRepository.findById(tenantId)
                        .orElseThrow(()-> new RuntimeException("Tenant Not found..!!"));
                newAccessRight.setTenant(existingTenant);
                return accessRightRepository.save(newAccessRight);
            });

            // Create the RoleAccessRights entity and save it
            RoleAccessRights roleAccessRights = new RoleAccessRights(existingRole, accessRight);
            roleAccessRightsRepository.save(roleAccessRights);
        }
    }

    public ResponseEntity<Role> addRole(String newRole, List<AccessRightDTO> roleAccessRights) {
        Long tenantId = checkEditUserAccessPermission();

        // Step 1: Check for existing role
        Role existingRole = rolesRepository.findByRoleNameAndTenant_TenantId(newRole, tenantId);
        if (existingRole != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(null);
        }

        // Step 2: Create new role
        Role role = new Role();
        role.setRoleName(newRole);

        Tenant tenant = tenantRepository.findById(tenantId)
                        .orElseThrow(()-> new RuntimeException("Tenant Not found..!!"));

        role.setTenant(tenant);
        Role savedRole = rolesRepository.save(role);

        // Step 3: Assign access rights
        List<RoleAccessRights> accessRightsList = new ArrayList<>();
        for (AccessRightDTO dto : roleAccessRights) {
            // Try to find the AccessRight based on moduleName and permissions
            Optional<AccessRight> existing = accessRightRepository.findByModuleNameAndCanViewAndCanEditAndCanDeleteAndTenant_TenantId(
                    dto.getModuleName(), dto.isCanView(), dto.isCanEdit(), dto.isCanDelete(), tenantId);

            AccessRight accessRight = existing.orElseGet(() -> {
                AccessRight newAr = new AccessRight();
                newAr.setModuleName(dto.getModuleName());
                newAr.setCanView(dto.isCanView());
                newAr.setCanEdit(dto.isCanEdit());
                newAr.setCanDelete(dto.isCanDelete());
                Tenant existingTenant = tenantRepository.findById(tenantId)
                        .orElseThrow(()-> new RuntimeException("Tenant Not found..!!"));
                newAr.setTenant(existingTenant);
                return accessRightRepository.save(newAr);
            });

            // Create RoleAccessRights mapping
            RoleAccessRights rar = new RoleAccessRights(savedRole, accessRight);

            accessRightsList.add(rar);
        }


        roleAccessRightsRepository.saveAll(accessRightsList);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedRole);
    }



}

