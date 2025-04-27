package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "login_audit")
public class login_audit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long auditId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)

    private User user;

    @ManyToOne
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    private LocalDateTime lastloginTimestamp;

    private String task;

    // Getters and Setters

    public Long getAuditId() {
        return auditId;
    }

    public void setAuditId(Long auditId) {
        this.auditId = auditId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Tenant getTenant() {
        return tenant;
    }

    public void setTenantId(Tenant tenant) {
        this.tenant = tenant;
    }

    public LocalDateTime getLastLoginTimestamp() {
        return lastloginTimestamp;
    }

    public void setLastLoginTimestamp(LocalDateTime lastloginTimestamp) {
        this.lastloginTimestamp = lastloginTimestamp;

    }

}
