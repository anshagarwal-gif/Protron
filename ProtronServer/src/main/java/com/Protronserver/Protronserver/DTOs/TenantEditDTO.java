package com.Protronserver.Protronserver.DTOs;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TenantEditDTO {

    private String tenantName;
    private String tenantContactName;
    private String tenantContactEmail;
    private String tenantContactDesc;
    private String tenantContactPhone;
    private String tenantAddressLine1;
    private String tenantAddressLine2;
    private String tenantAddressLine3;
    private String tenantAddressPostalCode;

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
}
