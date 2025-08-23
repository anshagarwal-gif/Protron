package com.Protronserver.Protronserver.DTOs;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for Budget Line operations
 */
public class BudgetLineRequest {

    // tenantId is now automatically set from logged-in user

    @NotBlank(message = "Budget name is required")
    private String budgetName;

    private String budgetDescription;
    private String budgetLineItem;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate budgetEndDate;

    private String budgetOwner;
    private String sponsor;
    private String lob;

    @NotBlank(message = "Currency is required")
    private String currency = "USD";

    @NotNull(message = "Amount approved is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Amount approved must be greater than 0")
    private BigDecimal amountApproved;

    private BigDecimal amountUtilized = BigDecimal.ZERO;
    private BigDecimal amountAvailable = BigDecimal.ZERO;
    private String remarks;
    private String lastUpdatedBy;
    private byte[] attachment;

    // List of allocations to be created with this budget line
    private List<BudgetLineAllocationRequest> allocations;

    // Default constructor
    public BudgetLineRequest() {
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

    public String getLastUpdatedBy() {
        return lastUpdatedBy;
    }

    public void setLastUpdatedBy(String lastUpdatedBy) {
        this.lastUpdatedBy = lastUpdatedBy;
    }

    public byte[] getAttachment() {
        return attachment;
    }

    public void setAttachment(byte[] attachment) {
        this.attachment = attachment;
    }

    public List<BudgetLineAllocationRequest> getAllocations() {
        return allocations;
    }

    public void setAllocations(List<BudgetLineAllocationRequest> allocations) {
        this.allocations = allocations;
    }
}