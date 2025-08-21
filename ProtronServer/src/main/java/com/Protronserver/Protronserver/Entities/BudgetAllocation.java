package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import com.Protronserver.Protronserver.Entities.SystemMaster;

/**
 * Entity class for budget_allocation table
 */
@Entity
@Table(name = "budget_allocation")
public class BudgetAllocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Added auto-generation
    @Column(name = "allocation_id")
    private Integer allocationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "budget_id", referencedColumnName = "budget_id")
    private BudgetLine budgetLine;

    @Column(name = "tenant_id", length = 50)
    private String tenantId;

    @Column(name = "vendor_name", length = 255)
    private String vendorName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "system_id", referencedColumnName = "systemid")
    private SystemMaster system;

    @Column(name = "system_name", length = 255)
    private String systemName;

    @Column(name = "amount", precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "remarks", length = 500)
    private String remarks;

    // Default constructor
    public BudgetAllocation() {
    }

    // Constructor with parameters
    public BudgetAllocation(BudgetLine budgetLine, String tenantId, String vendorName,
            SystemMaster system, String systemName, BigDecimal amount, String remarks) {
        this.budgetLine = budgetLine;
        this.tenantId = tenantId;
        this.vendorName = vendorName;
        this.system = system;
        this.systemName = systemName;
        this.amount = amount;
        this.remarks = remarks;
    }

    // Getters and Setters
    public Integer getAllocationId() {
        return allocationId;
    }

    public void setAllocationId(Integer allocationId) {
        this.allocationId = allocationId;
    }

    public BudgetLine getBudgetLine() {
        return budgetLine;
    }

    public void setBudgetLine(BudgetLine budgetLine) {
        this.budgetLine = budgetLine;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getVendorName() {
        return vendorName;
    }

    public void setVendorName(String vendorName) {
        this.vendorName = vendorName;
    }

    public SystemMaster getSystem() {
        return system;
    }

    public void setSystem(SystemMaster system) {
        this.system = system;
    }

    public String getSystemName() {
        return systemName;
    }

    public void setSystemName(String systemName) {
        this.systemName = systemName;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    @Override
    public String toString() {
        return "BudgetAllocation{" +
                "allocationId=" + allocationId +
                ", budgetLineId=" + (budgetLine != null ? budgetLine.getBudgetId() : null) +
                ", vendorName='" + vendorName + '\'' +
                ", system='" + (system != null ? system.getSystemName() : null) + '\'' +
                ", systemName='" + systemName + '\'' +
                ", amount=" + amount +
                '}';
    }
}