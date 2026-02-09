package com.Protronserver.Protronserver.Entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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

    // Add this field after tenantAddressPostalCode
    @Lob
    @Column(name = "tenant_logo", columnDefinition = "LONGBLOB")
    private byte[] tenantLogo;

    // Add getters and setters
    public byte[] getTenantLogo() {
        return tenantLogo;
    }

    public void setTenantLogo(byte[] tenantLogo) {
        this.tenantLogo = tenantLogo;
    }

    // Define relationships with other entities
    @OneToMany(mappedBy = "tenant")
    @JsonIgnoreProperties({"tenant", "projects", "projectTeams", "projectsManaged", "role"})
    @JsonBackReference
    private List<User> users;

    @OneToMany(mappedBy = "tenant")
    @JsonIgnoreProperties("tenant")
    private List<Role> roles;

    @OneToMany(mappedBy = "tenant")
    @JsonIgnoreProperties({"tenant"})
    private List<Project> projects;

    @OneToMany(mappedBy = "tenant")
    @JsonIgnoreProperties("tenant")
    private List<AccessRight> roleAccesses;

    @OneToMany(mappedBy = "tenant")
    private List<ProjectTeam> projectTeams;

    @OneToMany(mappedBy = "tenant")
    private List<Certificate> certificates;

    public Long getTenantId() {
        return tenantId;
    }

    public void setTenantId(Long tenantId) {
        this.tenantId = tenantId;
    }

    public String getTenantName() {
        return tenantName;
    }

    public void setTenantName(String tenantName) {
        this.tenantName = tenantName;
    }

    public String getTenantContactName() {
        return tenantContactName;
    }

    public void setTenantContactName(String tenantContactName) {
        this.tenantContactName = tenantContactName;
    }

    public String getTenantContactEmail() {
        return tenantContactEmail;
    }

    public void setTenantContactEmail(String tenantContactEmail) {
        this.tenantContactEmail = tenantContactEmail;
    }

    public String getTenantContactDesc() {
        return tenantContactDesc;
    }

    public void setTenantContactDesc(String tenantContactDesc) {
        this.tenantContactDesc = tenantContactDesc;
    }

    public String getTenantContactPhone() {
        return tenantContactPhone;
    }

    public void setTenantContactPhone(String tenantContactPhone) {
        this.tenantContactPhone = tenantContactPhone;
    }

    public String getTenantAddressLine1() {
        return tenantAddressLine1;
    }

    public void setTenantAddressLine1(String tenantAddressLine1) {
        this.tenantAddressLine1 = tenantAddressLine1;
    }

    public String getTenantAddressLine2() {
        return tenantAddressLine2;
    }

    public void setTenantAddressLine2(String tenantAddressLine2) {
        this.tenantAddressLine2 = tenantAddressLine2;
    }

    public String getTenantAddressLine3() {
        return tenantAddressLine3;
    }

    public void setTenantAddressLine3(String tenantAddressLine3) {
        this.tenantAddressLine3 = tenantAddressLine3;
    }

    public String getTenantAddressPostalCode() {
        return tenantAddressPostalCode;
    }

    public void setTenantAddressPostalCode(String tenantAddressPostalCode) {
        this.tenantAddressPostalCode = tenantAddressPostalCode;
    }

    public List<User> getUsers() {
        return users;
    }

    public void setUsers(List<User> users) {
        this.users = users;
    }

    public List<Role> getRoles() {
        return roles;
    }

    public void setRoles(List<Role> roles) {
        this.roles = roles;
    }

    public List<Project> getProjects() {
        return projects;
    }

    public void setProjects(List<Project> projects) {
        this.projects = projects;
    }

    public List<AccessRight> getRoleAccesses() {
        return roleAccesses;
    }

    public void setRoleAccesses(List<AccessRight> roleAccesses) {
        this.roleAccesses = roleAccesses;
    }

    public List<ProjectTeam> getProjectTeams() {
        return projectTeams;
    }

    public void setProjectTeams(List<ProjectTeam> projectTeams) {
        this.projectTeams = projectTeams;
    }

    public List<Certificate> getCertificates() {
        return certificates;
    }

    public void setCertificates(List<Certificate> certificates) {
        this.certificates = certificates;
    }
}
