package com.Protronserver.Protronserver.DTOs;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for Budget Line operations
 */
public class BudgetLineResponse {

    private Integer budgetId;
    private String tenantId;
    private String budgetName;
    private String budgetDescription;
    private String budgetLineItem;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate budgetEndDate;

    private String budgetOwner;
    private String sponsor;
    private String lob;
    private String currency;
    private BigDecimal amountApproved;
    private BigDecimal amountUtilized;
    private BigDecimal amountAvailable;
    private String remarks;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startTimestamp;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime endTimestamp;

    private String lastUpdatedBy;
    private boolean hasAttachment;
    private List<BudgetAllocationResponse> allocations;

    // Default constructor
    public BudgetLineResponse() {
    }

    // Getters and Setters
    public Integer getBudgetId() {
        return budgetId;
    }

    public void setBudgetId(Integer budgetId) {
        this.budgetId = budgetId;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getBudgetName() {
        return budgetName;
    }

    public void setBudgetName(String budgetName) {
        this.budgetName = budgetName;
    }

    public String getBudgetDescription() {
        return budgetDescription;
    }

    public void setBudgetDescription(String budgetDescription) {
        this.budgetDescription = budgetDescription;
    }

    public String getBudgetLineItem() {
        return budgetLineItem;
    }

    public void setBudgetLineItem(String budgetLineItem) {
        this.budgetLineItem = budgetLineItem;
    }

    public LocalDate getBudgetEndDate() {
        return budgetEndDate;
    }

    public void setBudgetEndDate(LocalDate budgetEndDate) {
        this.budgetEndDate = budgetEndDate;
    }

    public String getBudgetOwner() {
        return budgetOwner;
    }

    public void setBudgetOwner(String budgetOwner) {
        this.budgetOwner = budgetOwner;
    }

    public String getSponsor() {
        return sponsor;
    }

    public void setSponsor(String sponsor) {
        this.sponsor = sponsor;
    }

    public String getLob() {
        return lob;
    }

    public void setLob(String lob) {
        this.lob = lob;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getAmountApproved() {
        return amountApproved;
    }

    public void setAmountApproved(BigDecimal amountApproved) {
        this.amountApproved = amountApproved;
    }

    public BigDecimal getAmountUtilized() {
        return amountUtilized;
    }

    public void setAmountUtilized(BigDecimal amountUtilized) {
        this.amountUtilized = amountUtilized;
    }

    public BigDecimal getAmountAvailable() {
        return amountAvailable;
    }

    public void setAmountAvailable(BigDecimal amountAvailable) {
        this.amountAvailable = amountAvailable;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public LocalDateTime getStartTimestamp() {
        return startTimestamp;
    }

    public void setStartTimestamp(LocalDateTime startTimestamp) {
        this.startTimestamp = startTimestamp;
    }

    public LocalDateTime getEndTimestamp() {
        return endTimestamp;
    }

    public void setEndTimestamp(LocalDateTime endTimestamp) {
        this.endTimestamp = endTimestamp;
    }

    public String getLastUpdatedBy() {
        return lastUpdatedBy;
    }

    public void setLastUpdatedBy(String lastUpdatedBy) {
        this.lastUpdatedBy = lastUpdatedBy;
    }

    public boolean isHasAttachment() {
        return hasAttachment;
    }

    public void setHasAttachment(boolean hasAttachment) {
        this.hasAttachment = hasAttachment;
    }

    public List<BudgetAllocationResponse> getAllocations() {
        return allocations;
    }

    public void setAllocations(List<BudgetAllocationResponse> allocations) {
        this.allocations = allocations;
    }
}
