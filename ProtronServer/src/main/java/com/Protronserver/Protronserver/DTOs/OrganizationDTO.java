package com.Protronserver.Protronserver.DTOs;

public class OrganizationDTO {
    private Integer orgId;
    private String orgName;
    private String orgAddress;
    private String orgCity;
    private String orgState;
    private String orgCountry;
    private String orgZip;
    private String orgType;
    private String orgTaxName;
    private String orgTaxId;
    private String orgDesc;
    private Long tenantId;

    // Default constructor
    public OrganizationDTO() {
    }

    // Constructor with all fields
    public OrganizationDTO(Integer orgId, String orgName, String orgAddress, String orgCity,
            String orgState, String orgCountry, String orgZip, String orgType,
            String orgTaxName, String orgTaxId, String orgDesc, Long tenantId) {
        this.orgId = orgId;
        this.orgName = orgName;
        this.orgAddress = orgAddress;
        this.orgCity = orgCity;
        this.orgState = orgState;
        this.orgCountry = orgCountry;
        this.orgZip = orgZip;
        this.orgType = orgType;
        this.orgTaxName = orgTaxName;
        this.orgTaxId = orgTaxId;
        this.orgDesc = orgDesc;
        this.tenantId = tenantId;
    }

    // Getters and Setters
    public Integer getOrgId() {
        return orgId;
    }

    public void setOrgId(Integer orgId) {
        this.orgId = orgId;
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

    public Long getTenantId() {
        return tenantId;
    }

    public void setTenantId(Long tenantId) {
        this.tenantId = tenantId;
    }
}

