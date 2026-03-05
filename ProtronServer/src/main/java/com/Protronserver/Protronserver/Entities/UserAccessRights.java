package com.Protronserver.Protronserver.Entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Getter
@Setter
@Entity
@AllArgsConstructor
@Table(name = "user_access_rights")
@EntityListeners(AuditingEntityListener.class)
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

    @Column(name = "updated_by", nullable = true)
    @LastModifiedBy
    private String updatedBy;

    @Column(name = "updated_ts", nullable = true)
    @LastModifiedDate
    private LocalDateTime updatedTs;

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
