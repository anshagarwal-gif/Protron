package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String invoiceId;

    @Column(nullable = false)
    private Long tenantId;

    @Column(columnDefinition = "TEXT")
    private String invoiceName;

    @Column(length = 20)
    private String invoiceType; // DOMESTIC or INTERNATIONAL

    @Column(columnDefinition = "TEXT")
    private String customerInfo;
    @Column(columnDefinition = "TEXT")
    private String supplierInfo;

    @Column(nullable = false)
    private String customerName;

    @Column(columnDefinition = "TEXT")
    private String customerAddress;

    @Column(columnDefinition = "TEXT")
    private String billToAddress;

    @Column(columnDefinition = "TEXT")
    private String shipToAddress;

    @Column(nullable = false)
    private String supplierName;

    @Column(columnDefinition = "TEXT")
    private String supplierAddress;

    @Column(nullable = false)
    private BigDecimal rate;

    @Column(nullable = false)
    private String currency;

    @Column(nullable = false)
    private LocalDate fromDate;

    @Column(nullable = false)
    private LocalDate toDate;

    @Column(nullable = false)
    private Double hoursSpent;

    @Column(nullable = false)
    private BigDecimal totalAmount;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(columnDefinition = "TEXT")
    private String projectName;

    @Column(precision = 10, scale = 2)
    private BigDecimal discountPercent;

    @Column
    private LocalDate dueDate;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] pdfData;

    private String pdfFileName;
    private boolean deleted = false;
    private LocalDateTime deletedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceStatus status = InvoiceStatus.DRAFT;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<InvoiceItem> invoiceItems = new ArrayList<>();

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<InvoiceEmployee> invoiceEmployees = new ArrayList<>();

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<InvoiceTax> invoiceTaxes = new ArrayList<>();

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Payment> payments = new ArrayList<>();

    @Column(precision = 19, scale = 2)
    private BigDecimal totalPaidAmount = BigDecimal.ZERO;

    @Column(precision = 19, scale = 2)
    private BigDecimal outstandingAmount;

    @Column
    private LocalDate lastPaymentDate;

    @Column
    private LocalDate fullyPaidDate;

    // Attachments - storing up to 4 attachments
    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] attachment1Data;

    private String attachment1FileName;

    private String attachment1ContentType;

    private String country;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] attachment2Data;

    private String attachment2FileName;

    private String attachment2ContentType;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] attachment3Data;

    private String attachment3FileName;

    private String attachment3ContentType;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] attachment4Data;

    private String attachment4FileName;

    private String attachment4ContentType;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = true)
    @LastModifiedBy
    private String updatedBy;

    @Column(nullable = true)
    @LastModifiedDate
    private LocalDateTime updatedTs;


    @PrePersist
    protected void onCreate() {
        if (invoiceId == null) {
            invoiceId = "INV-" + System.currentTimeMillis();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedTs = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedTs = LocalDateTime.now();
    }

    // Helper methods to get attachment info
    public int getAttachmentCount() {
        int count = 0;
        if (attachment1Data != null)
            count++;
        if (attachment2Data != null)
            count++;
        if (attachment3Data != null)
            count++;
        if (attachment4Data != null)
            count++;
        return count;
    }

    public List<String> getAttachmentFileNames() {
        List<String> fileNames = new ArrayList<>();
        if (attachment1FileName != null)
            fileNames.add(attachment1FileName);
        if (attachment2FileName != null)
            fileNames.add(attachment2FileName);
        if (attachment3FileName != null)
            fileNames.add(attachment3FileName);
        if (attachment4FileName != null)
            fileNames.add(attachment4FileName);
        return fileNames;
    }

    public List<InvoiceItem> getInvoiceItems() {
        return invoiceItems;
    }

    public void setInvoiceItems(List<InvoiceItem> invoiceItems) {
        this.invoiceItems = invoiceItems;
    }

    public List<InvoiceEmployee> getInvoiceEmployees() {
        return invoiceEmployees;
    }

    public void setInvoiceEmployees(List<InvoiceEmployee> invoiceEmployees) {
        this.invoiceEmployees = invoiceEmployees;
    }

    public List<InvoiceTax> getInvoiceTaxes() {
        return invoiceTaxes;
    }

    public void setInvoiceTaxes(List<InvoiceTax> invoiceTaxes) {
        this.invoiceTaxes = invoiceTaxes;
    }

    public Long getTenantId() {
        return tenantId;
    }

    public void setTenantId(Long tenantId) {
        this.tenantId = tenantId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getInvoiceId() {
        return invoiceId;
    }

    public void setInvoiceId(String invoiceId) {
        this.invoiceId = invoiceId;
    }

    public String getInvoiceName() {
        return invoiceName;
    }

    public String getCustomerInfo() {
        return customerInfo;
    }

    public void setCustomerInfo(String customerInfo) {
        this.customerInfo = customerInfo;
    }

    public String getSupplierInfo() {
        return supplierInfo;
    }

    public void setSupplierInfo(String supplierInfo) {
        this.supplierInfo = supplierInfo;
    }

    public void setInvoiceName(String invoiceName) {
        this.invoiceName = invoiceName;
    }

    public String getInvoiceType() {
        return invoiceType;
    }

    public void setInvoiceType(String invoiceType) {
        this.invoiceType = invoiceType;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerAddress() {
        return customerAddress;
    }

    public void setCustomerAddress(String customerAddress) {
        this.customerAddress = customerAddress;
    }

    public String getBillToAddress() {
        return billToAddress;
    }

    public void setBillToAddress(String billToAddress) {
        this.billToAddress = billToAddress;
    }

    public String getShipToAddress() {
        return shipToAddress;
    }

    public void setShipToAddress(String shipToAddress) {
        this.shipToAddress = shipToAddress;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public String getSupplierAddress() {
        return supplierAddress;
    }

    public void setSupplierAddress(String supplierAddress) {
        this.supplierAddress = supplierAddress;
    }

    public BigDecimal getRate() {
        return rate;
    }

    public void setRate(BigDecimal rate) {
        this.rate = rate;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public LocalDate getFromDate() {
        return fromDate;
    }

    public void setFromDate(LocalDate fromDate) {
        this.fromDate = fromDate;
    }

    public LocalDate getToDate() {
        return toDate;
    }

    public void setToDate(LocalDate toDate) {
        this.toDate = toDate;
    }

    public Double getHoursSpent() {
        return hoursSpent;
    }

    public void setHoursSpent(Double hoursSpent) {
        this.hoursSpent = hoursSpent;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public byte[] getPdfData() {
        return pdfData;
    }

    public void setPdfData(byte[] pdfData) {
        this.pdfData = pdfData;
    }

    public String getPdfFileName() {
        return pdfFileName;
    }

    public void setPdfFileName(String pdfFileName) {
        this.pdfFileName = pdfFileName;
    }

    public byte[] getAttachment1Data() {
        return attachment1Data;
    }

    public void setAttachment1Data(byte[] attachment1Data) {
        this.attachment1Data = attachment1Data;
    }

    public String getAttachment1FileName() {
        return attachment1FileName;
    }

    public void setAttachment1FileName(String attachment1FileName) {
        this.attachment1FileName = attachment1FileName;
    }

    public String getAttachment1ContentType() {
        return attachment1ContentType;
    }

    public void setAttachment1ContentType(String attachment1ContentType) {
        this.attachment1ContentType = attachment1ContentType;
    }

    public byte[] getAttachment2Data() {
        return attachment2Data;
    }

    public void setAttachment2Data(byte[] attachment2Data) {
        this.attachment2Data = attachment2Data;
    }

    public String getAttachment2FileName() {
        return attachment2FileName;
    }

    public void setAttachment2FileName(String attachment2FileName) {
        this.attachment2FileName = attachment2FileName;
    }

    public String getAttachment2ContentType() {
        return attachment2ContentType;
    }

    public void setAttachment2ContentType(String attachment2ContentType) {
        this.attachment2ContentType = attachment2ContentType;
    }

    public byte[] getAttachment3Data() {
        return attachment3Data;
    }

    public void setAttachment3Data(byte[] attachment3Data) {
        this.attachment3Data = attachment3Data;
    }

    public String getAttachment3FileName() {
        return attachment3FileName;
    }

    public void setAttachment3FileName(String attachment3FileName) {
        this.attachment3FileName = attachment3FileName;
    }

    public String getAttachment3ContentType() {
        return attachment3ContentType;
    }

    public void setAttachment3ContentType(String attachment3ContentType) {
        this.attachment3ContentType = attachment3ContentType;
    }

    public byte[] getAttachment4Data() {
        return attachment4Data;
    }

    public void setAttachment4Data(byte[] attachment4Data) {
        this.attachment4Data = attachment4Data;
    }

    public String getAttachment4FileName() {
        return attachment4FileName;
    }

    public void setAttachment4FileName(String attachment4FileName) {
        this.attachment4FileName = attachment4FileName;
    }

    public String getAttachment4ContentType() {
        return attachment4ContentType;
    }

    public void setAttachment4ContentType(String attachment4ContentType) {
        this.attachment4ContentType = attachment4ContentType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedTs() {
        return updatedTs;
    }

    public void setUpdatedTs(LocalDateTime updatedTs) {
        this.updatedTs = updatedTs;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
    // Getter and Setter methods for soft delete fields

    /**
     * Check if the invoice is soft deleted
     * 
     * @return true if invoice is deleted, false otherwise
     */
    public boolean isDeleted() {
        return deleted;
    }

    /**
     * Set the deleted status of the invoice
     * 
     * @param deleted true to mark as deleted, false to mark as active
     */
    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }

    /**
     * Get the timestamp when the invoice was deleted
     * 
     * @return LocalDateTime of deletion, null if not deleted
     */
    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

    /**
     * Set the timestamp when the invoice was deleted
     * 
     * @param deletedAt LocalDateTime of deletion
     */
    public void setDeletedAt(LocalDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }

    public InvoiceStatus getStatus() {
        return status;
    }

    public void setStatus(InvoiceStatus status) {
        this.status = status;
    }

    public BigDecimal getDiscountPercent() {
        return discountPercent;
    }

    public void setDiscountPercent(BigDecimal discountPercent) {
        this.discountPercent = discountPercent;
    }

    // Payment tracking methods
    public List<Payment> getPayments() {
        return payments;
    }

    public void setPayments(List<Payment> payments) {
        this.payments = payments;
    }

    public BigDecimal getTotalPaidAmount() {
        return totalPaidAmount;
    }

    public void setTotalPaidAmount(BigDecimal totalPaidAmount) {
        this.totalPaidAmount = totalPaidAmount;
    }

    public BigDecimal getOutstandingAmount() {
        return outstandingAmount != null ? outstandingAmount : totalAmount.subtract(totalPaidAmount);
    }

    public void setOutstandingAmount(BigDecimal outstandingAmount) {
        this.outstandingAmount = outstandingAmount;
    }

    public LocalDate getLastPaymentDate() {
        return lastPaymentDate;
    }

    public void setLastPaymentDate(LocalDate lastPaymentDate) {
        this.lastPaymentDate = lastPaymentDate;
    }

    public LocalDate getFullyPaidDate() {
        return fullyPaidDate;
    }

    public void setFullyPaidDate(LocalDate fullyPaidDate) {
        this.fullyPaidDate = fullyPaidDate;
    }

    // Business logic methods
    public boolean isFullyPaid() {
        return getOutstandingAmount().compareTo(BigDecimal.ZERO) <= 0;
    }

    public boolean isPartiallyPaid() {
        return totalPaidAmount.compareTo(BigDecimal.ZERO) > 0 && !isFullyPaid();
    }

    public BigDecimal getPaymentProgressPercentage() {
        if (totalAmount.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return totalPaidAmount.divide(totalAmount, 4, BigDecimal.ROUND_HALF_UP)
                .multiply(new BigDecimal("100"));
    }
}