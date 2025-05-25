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
@AllArgsConstructor
@Table(name = "user_access_rights")
public class UserAccessRights {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userAccessRightsId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "access_id")
    @JsonIgnoreProperties("tenant")
    private AccessRight accessRight;

    public UserAccessRights() {}

    public UserAccessRights(User user, AccessRight accessRight) {
        this.user = user;
        this.accessRight = accessRight;
    }

    public Long getUserAccessRightsId() {
        return userAccessRightsId;
    }

    public void setUserAccessRightsId(Long userAccessRightsId) {
        this.userAccessRightsId = userAccessRightsId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public AccessRight getAccessRight() {
        return accessRight;
    }

    public void setAccessRight(AccessRight accessRight) {
        this.accessRight = accessRight;
    }
}
