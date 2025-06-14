package com.Protronserver.Protronserver.Entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "role_access_rights")
public class RoleAccessRights {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long roleAccessRightsId;

    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;

    @ManyToOne
    @JoinColumn(name = "access_id")
    @JsonIgnoreProperties("tenant")
    private AccessRight accessRight;

    public RoleAccessRights() {
    }

    public RoleAccessRights(Role role, AccessRight accessRight) {
        this.role = role;
        this.accessRight = accessRight;
    }

    public Long getRoleAccessRightsId() {
        return roleAccessRightsId;
    }

    public void setRoleAccessRightsId(Long roleAccessRightsId) {
        this.roleAccessRightsId = roleAccessRightsId;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public AccessRight getAccessRight() {
        return accessRight;
    }

    public void setAccessRight(AccessRight accessRight) {
        this.accessRight = accessRight;
    }
}
