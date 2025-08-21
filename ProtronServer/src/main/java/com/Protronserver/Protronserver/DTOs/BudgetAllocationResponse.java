package com.Protronserver.Protronserver.DTOs;

import java.math.BigDecimal;

// Response DTO for Budget Allocation
public class BudgetAllocationResponse {
    private Integer allocationId;
    private Integer budgetLineId;
    private String budgetLineName;
    private String tenantId;
    private String vendorName;
    private String systemName;
    private BigDecimal amount;
    private String remarks;

    // Getters and Setters
    public Integer getAllocationId() {
        return allocationId;
    }

    public void setAllocationId(Integer allocationId) {
        this.allocationId = allocationId;
    }

    public Integer getBudgetLineId() {
        return budgetLineId;
    }

    public void setBudgetLineId(Integer budgetLineId) {
        this.budgetLineId = budgetLineId;
    }

    public String getBudgetLineName() {
        return budgetLineName;
    }

    public void setBudgetLineName(String budgetLineName) {
        this.budgetLineName = budgetLineName;
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
}
