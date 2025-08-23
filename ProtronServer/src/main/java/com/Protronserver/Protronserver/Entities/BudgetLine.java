package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity class for budget_line table
 */
@Entity
@Table(name = "budget_line")
public class BudgetLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Added auto-generation
    @Column(name = "budget_id")
    private Integer budgetId;

    @Column(name = "tenant_id", length = 50)
    private String tenantId;

    @Column(name = "budget_name", length = 200, nullable = false)
    private String budgetName;

    @Column(name = "budget_description", length = 500)
    private String budgetDescription;

    @Column(name = "budget_line_item", length = 100)
    private String budgetLineItem;

    @Column(name = "budget_end_date")
    private LocalDate budgetEndDate;

    @Column(name = "budget_owner", length = 150)
    private String budgetOwner;

    @Column(name = "sponsor", length = 150)
    private String sponsor;

    @Column(name = "lob", length = 50)
    private String lob; // Line of Business

    @Column(name = "currency", length = 50, nullable = false)
    private String currency = "USD";

    @Column(name = "amount_approved", precision = 15, scale = 2)
    private BigDecimal amountApproved;

    @Column(name = "amount_utilized", precision = 15, scale = 2)
    private BigDecimal amountUtilized;

    @Column(name = "amount_available", precision = 15, scale = 2)
    private BigDecimal amountAvailable;

    @Column(name = "remarks", length = 500)
    private String remarks;

    @Column(name = "start_timestamp")
    private LocalDateTime startTimestamp;

    @Column(name = "end_timestamp")
    private LocalDateTime endTimestamp;

    @Column(name = "last_updated_by", length = 100)
    private String lastUpdatedBy;

    @Lob
    @Column(name = "attachment")
    private byte[] attachment;

    // Default constructor
    public BudgetLine() {
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

    public byte[] getAttachment() {
        return attachment;
    }

    public void setAttachment(byte[] attachment) {
        this.attachment = attachment;
    }

    @Override
    public String toString() {
        return "BudgetLine{" +
                "budgetId=" + budgetId +
                ", budgetName='" + budgetName + '\'' +
                ", currency='" + currency + '\'' +
                ", amountApproved=" + amountApproved +
                ", hasAttachment=" + (attachment != null && attachment.length > 0) +
                '}';
    }
}