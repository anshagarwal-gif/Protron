package com.Protronserver.Protronserver.Entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "roles")
@EntityListeners(AuditingEntityListener.class)
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long roleId;
    private String roleName;

    @OneToMany(mappedBy = "role")
    @JsonBackReference
    @JsonIgnoreProperties("role")
    private List<User> users;

    @OneToMany(mappedBy = "role", fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"role"})
    private List<RoleAccessRights> roleAccessRights;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tenant_id")
    @JsonIgnoreProperties({"roles", "roleAccesses", "projects", "projectTeams", "certificates"})
    private Tenant tenant;

    @Column(name = "updated_by", nullable = true)
    @LastModifiedBy
    private String updatedBy;

    @Column(name = "updated_ts", nullable = true)
    @LastModifiedDate
    private LocalDateTime updatedTs;

    public Long getRoleId() {
        return roleId;
    }

    public void setRoleId(Long roleId) {
        this.roleId = roleId;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public List<User> getUsers() {
        return users;
    }

    public void setUsers(List<User> users) {
        this.users = users;
    }

    public List<RoleAccessRights> getRoleAccessRights() {
        return roleAccessRights;
    }

    public void setRoleAccessRights(List<RoleAccessRights> roleAccessRights) {
        this.roleAccessRights = roleAccessRights;
    }

    public Tenant getTenant() {
        return tenant;
    }

    public void setTenant(Tenant tenant) {
        this.tenant = tenant;
    }
}
