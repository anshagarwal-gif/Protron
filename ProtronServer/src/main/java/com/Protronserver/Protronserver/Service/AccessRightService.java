package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.AccessRightDTO;
import com.Protronserver.Protronserver.Entities.AccessRight;
import com.Protronserver.Protronserver.Entities.RoleAccessRights;
import com.Protronserver.Protronserver.Entities.UserAccessRights;
import com.Protronserver.Protronserver.Entities.Role;
import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.Repository.AccessRightRepository;
import com.Protronserver.Protronserver.Repository.RoleAccessRightsRepository;
import com.Protronserver.Protronserver.Repository.UserAccessRightsRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AccessRightService {

    @Autowired
    private AccessRightRepository accessRightRepository;

    @Autowired
    private RoleAccessRightsRepository roleAccessRightsRepository;

    @Autowired
    private UserAccessRightsRepository userAccessRightsRepository;

    @Transactional
    public void updateUserAccessRights(List<AccessRightDTO> updatedAccessRights) {
        // 1. Get the currently authenticated user
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if(principal instanceof User user){

            Role role = user.getRole();
        // 2. Get role-level access rights
            List<AccessRight> roleRights = roleAccessRightsRepository.findByRole(role).stream()
                    .map(RoleAccessRights::getAccessRight)
                    .toList();

            Map<String, AccessRight> roleMap = roleRights.stream()
                    .collect(Collectors.toMap(AccessRight::getModuleName, ar -> ar));

            // 3. Delete existing user-level overrides
            userAccessRightsRepository.deleteByUser(user);

            // 4. Compare updated access rights with role-level ones
            for (AccessRightDTO dto : updatedAccessRights) {
                AccessRight roleAR = roleMap.get(dto.getModuleName());

                boolean isDiff = roleAR == null ||
                        roleAR.isCanView() != dto.isCanView() ||
                        roleAR.isCanEdit() != dto.isCanEdit() ||
                        roleAR.isCanDelete() != dto.isCanDelete();

                if (isDiff) {
                    // 5. Reuse or create a new AccessRight
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

                    // 6. Save new user-level override
                    UserAccessRights userAR = new UserAccessRights(user, accessRight);
                    userAccessRightsRepository.save(userAR);
                }
            }
        }
    }


}
