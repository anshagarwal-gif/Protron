package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;
import com.Protronserver.Protronserver.Entities.Tenant;

@Entity
@Table(name = "system_master")
public class SystemMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "systemid", nullable = false, updatable = false)
    private Integer systemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant; // Assuming you have a Tenant entity

    @Column(name = "systemname", length = 250, nullable = false)
    private String systemName;

    @Column(name = "systemdesc", length = 1000)
    private String systemDesc;

    // Getters and Setters
    public Integer getSystemId() {
        return systemId;
    }

    public void setSystemId(Integer systemId) {
        this.systemId = systemId;
    }

    public String getSystemName() {
        return systemName;
    }

    public void setSystemName(String systemName) {
        this.systemName = systemName;
    }

    public String getSystemDesc() {
        return systemDesc;
    }

    public void setSystemDesc(String systemDesc) {
        this.systemDesc = systemDesc;
    }

    public Tenant getTenant() {
        return tenant;
    }

    public void setTenant(Tenant tenant) {
        this.tenant = tenant;
    }
}
