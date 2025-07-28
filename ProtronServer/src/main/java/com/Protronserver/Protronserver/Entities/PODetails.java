package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "po_detail")
public class PODetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "po_id")
    private Long poId;

    @Column(name = "po_number", length = 250)
    private String poNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "po_type", length = 50)
    private POType poType;

    @Column(name = "po_desc", length = 500)
    private String poDesc;

    @Column(name = "po_amount", precision = 10, scale = 2)
    private BigDecimal poAmount;

    @Column(name = "po_currency", length = 10)
    private String poCurrency;

    @Column(name = "po_spoc", length = 100)
    private String poSpoc;

    @Column(name = "supplier", length = 250)
    private String supplier;

    @Column(name = "customer", length = 250)
    private String customer;

    @Column(name = "project_name", length = 250)
    private String projectName;

    @Column(name = "po_startdate")
    private LocalDate poStartDate;

    @Column(name = "po_enddate")
    private LocalDate poEndDate;

    @Column(name = "create_timestamp", updatable = false)
    private LocalDateTime createTimestamp;

    @Column(name = "last_update_by", length = 100)
    private String lastUpdateBy;

    @Column(name = "end_timestamp")
    private LocalDateTime endTimestamp;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    // Enum for PO Type
    public enum POType {
        FIXED("Fixed"),
        MIXED("Mixed"),
        T_AND_M("T&M");

        private final String value;

        POType(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }
    }

    // Getters and Setters


    public Long getTenantId() {
        return tenantId;
    }

    public void setTenantId(Long tenantId) {
        this.tenantId = tenantId;
    }

    public Long getPoId() {
        return poId;
    }

    public void setPoId(Long poId) {
        this.poId = poId;
    }

    public String getPoNumber() {
        return poNumber;
    }

    public void setPoNumber(String poNumber) {
        this.poNumber = poNumber;
    }

    public POType getPoType() {
        return poType;
    }

    public void setPoType(POType poType) {
        this.poType = poType;
    }

    public String getPoDesc() {
        return poDesc;
    }

    public void setPoDesc(String poDesc) {
        this.poDesc = poDesc;
    }

    public BigDecimal getPoAmount() {
        return poAmount;
    }

    public void setPoAmount(BigDecimal poAmount) {
        this.poAmount = poAmount;
    }

    public String getPoCurrency() {
        return poCurrency;
    }

    public void setPoCurrency(String poCurrency) {
        this.poCurrency = poCurrency;
    }

    public String getPoSpoc() {
        return poSpoc;
    }

    public void setPoSpoc(String poSpoc) {
        this.poSpoc = poSpoc;
    }

    public String getSupplier() {
        return supplier;
    }

    public void setSupplier(String supplier) {
        this.supplier = supplier;
    }

    public String getCustomer() {
        return customer;
    }

    public void setCustomer(String customer) {
        this.customer = customer;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public LocalDate getPoStartDate() {
        return poStartDate;
    }

    public void setPoStartDate(LocalDate poStartDate) {
        this.poStartDate = poStartDate;
    }

    public LocalDate getPoEndDate() {
        return poEndDate;
    }

    public void setPoEndDate(LocalDate poEndDate) {
        this.poEndDate = poEndDate;
    }

    public LocalDateTime getCreateTimestamp() {
        return createTimestamp;
    }

    public void setCreateTimestamp(LocalDateTime createTimestamp) {
        this.createTimestamp = createTimestamp;
    }

    public String getLastUpdateBy() {
        return lastUpdateBy;
    }

    public void setLastUpdateBy(String lastUpdateBy) {
        this.lastUpdateBy = lastUpdateBy;
    }

    public LocalDateTime getEndTimestamp() {
        return endTimestamp;
    }

    public void setEndTimestamp(LocalDateTime endTimestamp) {
        this.endTimestamp = endTimestamp;
    }

    @Override
    public String toString() {
        return "PODetail{" +
                "poId=" + poId +
                ", poNumber='" + poNumber + '\'' +
                ", poType=" + poType +
                ", poDesc='" + poDesc + '\'' +
                ", poAmount=" + poAmount +
                ", poCurrency='" + poCurrency + '\'' +
                ", poSpoc='" + poSpoc + '\'' +
                ", supplier='" + supplier + '\'' +
                ", customer='" + customer + '\'' +
                ", projectName='" + projectName + '\'' +
                ", poStartDate=" + poStartDate +
                ", poEndDate=" + poEndDate +
                ", createTimestamp=" + createTimestamp +
                ", lastUpdateBy='" + lastUpdateBy + '\'' +
                ", endTimestamp=" + endTimestamp +
                '}';
    }
}
