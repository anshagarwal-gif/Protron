package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.AccessRightDTO;
import com.Protronserver.Protronserver.Entities.AccessRight;
import com.Protronserver.Protronserver.Entities.RoleAccessRights;
import com.Protronserver.Protronserver.Entities.UserAccessRights;
import com.Protronserver.Protronserver.Entities.Role;
import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.Repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

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

    private void checkEditUserAccessPermission() {
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
    }

    @Transactional
    public void updateUserAccessRights(Long userIdToUpdate, List<AccessRightDTO> updatedAccessRights) {
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
                Optional<AccessRight> existing = accessRightRepository.findByModuleNameAndCanViewAndCanEditAndCanDelete(
                        dto.getModuleName(), dto.isCanView(), dto.isCanEdit(), dto.isCanDelete());

                AccessRight accessRight = existing.orElseGet(() -> {
                    AccessRight newAr = new AccessRight();
                    newAr.setModuleName(dto.getModuleName());
                    newAr.setCanView(dto.isCanView());
                    newAr.setCanEdit(dto.isCanEdit());
                    newAr.setCanDelete(dto.isCanDelete());
                    return accessRightRepository.save(newAr);
                });

                UserAccessRights userAR = new UserAccessRights(userToUpdate, accessRight);
                userAccessRightsRepository.save(userAR);
            }
        }
    }

    @Transactional
    public void updateRoleAndAccess(Long userIdToUpdate, Long roleId, List<AccessRightDTO> updatedAccessRights) {
        checkEditUserAccessPermission();

        User userToUpdate = userRepository.findById(userIdToUpdate)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (userToUpdate.getRole() == null || !userToUpdate.getRole().getRoleId().equals(roleId)) {
            Role role = rolesRepository.findByRoleId(roleId)
                    .orElseThrow(() -> new RuntimeException("Role Not Found"));
            userToUpdate.setRole(role);
            userRepository.save(userToUpdate);
        }

        updateUserAccessRights(userIdToUpdate, updatedAccessRights);
    }

    public List<Role> getRoles(){
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (!(principal instanceof User loggedInUser)) {
            throw new RuntimeException("Unauthorized access");
        }

        return rolesRepository.findAll();
    }
}

