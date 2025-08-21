package com.Protronserver.Protronserver.DTOs;

import java.math.BigDecimal;

/**
 * DTO for budget allocations within budget line requests
 * This avoids entity deserialization issues
 */
public class BudgetLineAllocationRequest {

    private String vendorName;
    private Integer systemId;
    private String systemName;
    private BigDecimal amount;
    private String remarks;

    // Default constructor
    public BudgetLineAllocationRequest() {
    }

    // Constructor with parameters
    public BudgetLineAllocationRequest(String vendorName, Integer systemId, String systemName,
            BigDecimal amount, String remarks) {
        this.vendorName = vendorName;
        this.systemId = systemId;
        this.systemName = systemName;
        this.amount = amount;
        this.remarks = remarks;
    }

    // Getters and Setters
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
