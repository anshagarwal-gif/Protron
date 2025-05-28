package com.Protronserver.Protronserver.Entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "roles")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long roleId;
    private String roleName;

    @OneToMany(mappedBy = "role")
    @JsonBackReference
    @JsonIgnoreProperties("role")
    private List<User> users;

    @OneToMany(mappedBy = "role")
    @JsonIgnoreProperties({"role"})
    private List<RoleAccessRights> roleAccessRights;

    @ManyToOne
    @JoinColumn(name = "tenant_id")
    @JsonIgnoreProperties({"roles", "roleAccesses", "projects", "projectTeams", "certificates"})
    private Tenant tenant;

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
