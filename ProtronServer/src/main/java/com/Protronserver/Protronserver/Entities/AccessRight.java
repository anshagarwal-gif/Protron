package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "access_rights")
public class AccessRight {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long accessId;
    private String moduleName;
    private boolean canView;
    private boolean canEdit;
    private boolean canDelete;

    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;
}
