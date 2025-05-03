package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.Entities.Tenant;
import com.Protronserver.Protronserver.Entities.login_audit;
import com.Protronserver.Protronserver.Repository.LoginAuditRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class LoginAuditService {

    @Autowired
    private LoginAuditRepository loginAuditRepository;

    public login_audit recordLogin(User user, Tenant tenant, String timezoneId) {
        login_audit audit = new login_audit();
        audit.setUser(user);
        audit.setTenant(tenant);
        audit.setLastLoginTimestamp(LocalDateTime.now());
        audit.setTask("LOGIN");
        return loginAuditRepository.save(audit);
    }

    public login_audit recordLogout(User user) {
        login_audit audit = new login_audit();
        audit.setUser(user);
        audit.setTenant(user.getTenant()); // Get tenant from user object
        audit.setLastLoginTimestamp(LocalDateTime.now());
        audit.setTask("LOGOUT");
        return loginAuditRepository.save(audit);
    }
}
