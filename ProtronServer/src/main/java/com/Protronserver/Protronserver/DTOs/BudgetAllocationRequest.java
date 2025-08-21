package com.Protronserver.Protronserver.DTOs;

import java.math.BigDecimal;

public class BudgetAllocationRequest {
    private Integer budgetLineId;
    // tenantId is now automatically set from logged-in user
    private String vendorName;
    private Integer systemId;
    private String systemName;
    private BigDecimal amount;
    private String remarks;

    // Getters and Setters
    public Integer getBudgetLineId() {
        return budgetLineId;
    }

    public void setBudgetLineId(Integer budgetLineId) {
        this.budgetLineId = budgetLineId;
    }

    public String getVendorName() {
        return vendorName;
    }

    public void setVendorName(String vendorName) {
        this.vendorName = vendorName;
    }

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
