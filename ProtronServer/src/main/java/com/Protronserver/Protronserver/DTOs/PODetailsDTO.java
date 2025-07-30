package com.Protronserver.Protronserver.DTOs;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PODetailsDTO {

    private String poNumber;
    private String poType; // Enum value: "FIXED", "MIXED", "T_AND_M"
    private String poDesc;
    private BigDecimal poAmount;
    private String poCurrency;
    private String poSpoc;
    private String supplier;
    private String customer;
    private String sponsorName;
    private String sponsorLob;
    private String budgetLineItem;
    private BigDecimal budgetLineAmount;
    private String budgetLineRemarks;
    private String projectName;
    private LocalDate poStartDate;
    private LocalDate poEndDate;

    public String getBudgetLineItem() {
        return budgetLineItem;
    }

    public void setBudgetLineItem(String budgetLineItem) {
        this.budgetLineItem = budgetLineItem;
    }

    public BigDecimal getBudgetLineAmount() {
        return budgetLineAmount;
    }

    public void setBudgetLineAmount(BigDecimal budgetLineAmount) {
        this.budgetLineAmount = budgetLineAmount;
    }

    public String getBudgetLineRemarks() {
        return budgetLineRemarks;
    }

    public void setBudgetLineRemarks(String budgetLineRemarks) {
        this.budgetLineRemarks = budgetLineRemarks;
    }

    public String getSponsorName() {
        return sponsorName;
    }

    public void setSponsorName(String sponsorName) {
        this.sponsorName = sponsorName;
    }

    public String getSponsorLob() {
        return sponsorLob;
    }

    public void setSponsorLob(String sponsorLob) {
        this.sponsorLob = sponsorLob;
    }

    public LocalDate getPoEndDate() {
        return poEndDate;
    }

    public void setPoEndDate(LocalDate poEndDate) {
        this.poEndDate = poEndDate;
    }

    public LocalDate getPoStartDate() {
        return poStartDate;
    }

    public void setPoStartDate(LocalDate poStartDate) {
        this.poStartDate = poStartDate;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public String getCustomer() {
        return customer;
    }

    public void setCustomer(String customer) {
        this.customer = customer;
    }

    public String getSupplier() {
        return supplier;
    }

    public void setSupplier(String supplier) {
        this.supplier = supplier;
    }

    public String getPoSpoc() {
        return poSpoc;
    }

    public void setPoSpoc(String poSpoc) {
        this.poSpoc = poSpoc;
    }

    public String getPoCurrency() {
        return poCurrency;
    }

    public void setPoCurrency(String poCurrency) {
        this.poCurrency = poCurrency;
    }

    public BigDecimal getPoAmount() {
        return poAmount;
    }

    public void setPoAmount(BigDecimal poAmount) {
        this.poAmount = poAmount;
    }

    public String getPoDesc() {
        return poDesc;
    }

    public void setPoDesc(String poDesc) {
        this.poDesc = poDesc;
    }

    public String getPoType() {
        return poType;
    }

    public void setPoType(String poType) {
        this.poType = poType;
    }

    public String getPoNumber() {
        return poNumber;
    }

    public void setPoNumber(String poNumber) {
        this.poNumber = poNumber;
    }
}
