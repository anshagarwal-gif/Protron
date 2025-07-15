package com.Protronserver.Protronserver.Utils;

import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Objects;

@Service
public class LoggedInUserUtils {

    @Autowired
    private UserRepository userRepository;

    public User resolveTargetUser(Long userId, User loggedInUser) {
        if (userId == null) {
            if ("tenant_admin".equalsIgnoreCase(loggedInUser.getRole().getRoleName())) {
                throw new RuntimeException("Admin operation requires a target user ID.");
            }
            return loggedInUser;
        }

        if (!"tenant_admin".equalsIgnoreCase(loggedInUser.getRole().getRoleName())) {
            throw new RuntimeException("Access denied: only Tenant Admins can access other users' tasks.");
        }

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Target user not found."));

        if (!Objects.equals(targetUser.getTenant().getTenantId(), loggedInUser.getTenant().getTenantId())) {
            throw new RuntimeException("Target user does not belong to your tenant.");
        }

        return targetUser;
    }

    public User getLoggedInUser(){
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof User user)) {
            throw new RuntimeException("Session Expired");
        }

        return user;
    }

}
