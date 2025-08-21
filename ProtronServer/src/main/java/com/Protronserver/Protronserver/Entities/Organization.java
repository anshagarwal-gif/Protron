package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;

@Entity
@Table(name = "organization")
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "orgid", nullable = false, updatable = false)
    private Integer orgId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenantid", nullable = false)
    private Tenant tenant; // Assuming Tenant entity exists

    @Column(name = "orgname", length = 250, nullable = false)
    private String orgName;

    @Column(name = "orgaddress", length = 500)
    private String orgAddress;

    @Column(name = "orgcity", length = 100)
    private String orgCity;

    @Column(name = "orgstate", length = 100)
    private String orgState;

    @Column(name = "orgcountry", length = 100)
    private String orgCountry;

    @Column(name = "orgzip", length = 100)
    private String orgZip;

    @Column(name = "orgtype", length = 100)
    private String orgType;

    @Column(name = "orgtaxname", length = 100)
    private String orgTaxName;

    @Column(name = "orgtaxid", length = 500)
    private String orgTaxId;

    @Column(name = "orgdesc", length = 1000)
    private String orgDesc;

    // Getters and Setters
    public Integer getOrgId() {
        return orgId;
    }

    public void setOrgId(Integer orgId) {
        this.orgId = orgId;
    }

    public Tenant getTenant() {
        return tenant;
    }

    public void setTenant(Tenant tenant) {
        this.tenant = tenant;
    }

    public String getOrgName() {
        return orgName;
    }

    public void setOrgName(String orgName) {
        this.orgName = orgName;
    }

    public String getOrgAddress() {
        return orgAddress;
    }

    public void setOrgAddress(String orgAddress) {
        this.orgAddress = orgAddress;
    }

    public String getOrgCity() {
        return orgCity;
    }

    public void setOrgCity(String orgCity) {
        this.orgCity = orgCity;
    }

    public String getOrgState() {
        return orgState;
    }

    public void setOrgState(String orgState) {
        this.orgState = orgState;
    }

    public String getOrgCountry() {
        return orgCountry;
    }

    public void setOrgCountry(String orgCountry) {
        this.orgCountry = orgCountry;
    }

    public String getOrgZip() {
        return orgZip;
    }

    public void setOrgZip(String orgZip) {
        this.orgZip = orgZip;
    }

    public String getOrgType() {
        return orgType;
    }

    public void setOrgType(String orgType) {
        this.orgType = orgType;
    }

    public String getOrgTaxName() {
        return orgTaxName;
    }

    public void setOrgTaxName(String orgTaxName) {
        this.orgTaxName = orgTaxName;
    }

    public String getOrgTaxId() {
        return orgTaxId;
    }

    public void setOrgTaxId(String orgTaxId) {
        this.orgTaxId = orgTaxId;
    }

    public String getOrgDesc() {
        return orgDesc;
    }

    public void setOrgDesc(String orgDesc) {
        this.orgDesc = orgDesc;
    }
}
