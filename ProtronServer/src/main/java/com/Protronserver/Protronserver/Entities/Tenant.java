package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "tenant")
public class Tenant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tenant_id")
    private Long tenantId; // Using Long to match the role entity type

    @Column(name = "tenant_name", length = 250)
    private String tenantName;

    @Column(name = "tenant_contact_name", length = 100)
    private String tenantContactName;

    @Column(name = "tenant_contact_email", length = 100)
    private String tenantContactEmail;

    @Column(name = "tenant_contact_desc", length = 100)
    private String tenantContactDesc;

    @Column(name = "tenant_contact_phone", length = 100)
    private String tenantContactPhone;

    @Column(name = "tenant_address_line1", length = 250)
    private String tenantAddressLine1;

    @Column(name = "tenant_address_line2", length = 250)
    private String tenantAddressLine2;

    @Column(name = "tenant_address_line3", length = 250)
    private String tenantAddressLine3;

    @Column(name = "tenant_address_postal_code", length = 100)
    private String tenantAddressPostalCode;

    // Define relationships with other entities
    @OneToMany(mappedBy = "tenant")
    private List<User> users;

    @OneToMany(mappedBy = "tenant")
    private List<Role> roles;

    @OneToMany(mappedBy = "tenant")
    private List<Project> projects;

    @OneToMany(mappedBy = "tenant")
    private List<AccessRight> roleAccesses;

    @OneToMany(mappedBy = "tenant")
    private List<ProjectTeam> projectTeams;

    @OneToMany(mappedBy = "tenant")
    private List<Certificate> certificates;

}
