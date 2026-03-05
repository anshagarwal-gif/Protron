package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Getter
@Setter
@Entity
@Table(name = "login_audit")
@EntityListeners(AuditingEntityListener.class)
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

    @Column(nullable = false)
    @LastModifiedBy
    private String updatedBy;

    @Column(nullable = false)
    @LastModifiedDate
    private LocalDateTime updatedTs;


    private String task;

    // Getters and Setters


    public void setTenant(Tenant tenant) {
        this.tenant = tenant;
    }

    public LocalDateTime getLastloginTimestamp() {
        return lastloginTimestamp;
    }

    public void setLastloginTimestamp(LocalDateTime lastloginTimestamp) {
        this.lastloginTimestamp = lastloginTimestamp;
    }

    public String getTask() {
        return task;
    }

    public void setTask(String task) {
        this.task = task;
    }

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

    public LocalDateTime getUpdatedTs() {
        return updatedTs;
    }

    public void setUpdatedTs(LocalDateTime updatedTs) {
        this.updatedTs = updatedTs;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
