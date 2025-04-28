package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.Entities.login_audit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoginAuditRepository extends JpaRepository<login_audit, Long> {
    login_audit findTopByUserOrderByAuditIdDesc(User user);
}
