package com.Protronserver.Protronserver.DTOs;

import com.Protronserver.Protronserver.Entities.Tenant;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class TenantDTO {
    private Long tenantId;
    private String tenantName;
    private String tenantContactName;
    private String tenantContactEmail;
    private String tenantContactDesc;
    private String tenantContactPhone;
    private String tenantAddressLine1;
    private String tenantAddressLine2;
    private String tenantAddressLine3;
    private String tenantAddressPostalCode;
    private String updatedBy;
    private LocalDateTime updatedTs;

    // Constructor to map from Tenant entity
    public TenantDTO(Tenant tenant) {
        this.tenantId = tenant.getTenantId();
        this.tenantName = tenant.getTenantName();
        this.tenantContactName = tenant.getTenantContactName();
        this.tenantContactEmail = tenant.getTenantContactEmail();
        this.tenantContactDesc = tenant.getTenantContactDesc();
        this.tenantContactPhone = tenant.getTenantContactPhone();
        this.tenantAddressLine1 = tenant.getTenantAddressLine1();
        this.tenantAddressLine2 = tenant.getTenantAddressLine2();
        this.tenantAddressLine3 = tenant.getTenantAddressLine3();
        this.tenantAddressPostalCode = tenant.getTenantAddressPostalCode();
        this.updatedBy = tenant.getUpdatedBy();
        this.updatedTs = tenant.getUpdatedTs();
    }
}
