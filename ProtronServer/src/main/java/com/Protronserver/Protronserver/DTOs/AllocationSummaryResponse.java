package com.Protronserver.Protronserver.DTOs;

import java.math.BigDecimal;

public class AllocationSummaryResponse {
    private Integer budgetLineId;
    private String budgetLineName;
    private BigDecimal totalApproved;
    private BigDecimal totalAllocated;
    private BigDecimal remainingAmount;
    private Long allocationCount;
    private String currency;

    // Getters and Setters
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

    public BigDecimal getTotalApproved() {
        return totalApproved;
    }

    public void setTotalApproved(BigDecimal totalApproved) {
        this.totalApproved = totalApproved;
    }

    public BigDecimal getTotalAllocated() {
        return totalAllocated;
    }

    public void setTotalAllocated(BigDecimal totalAllocated) {
        this.totalAllocated = totalAllocated;
    }

    public BigDecimal getRemainingAmount() {
        return remainingAmount;
    }

    public void setRemainingAmount(BigDecimal remainingAmount) {
        this.remainingAmount = remainingAmount;
    }

    public Long getAllocationCount() {
        return allocationCount;
    }

    public void setAllocationCount(Long allocationCount) {
        this.allocationCount = allocationCount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}