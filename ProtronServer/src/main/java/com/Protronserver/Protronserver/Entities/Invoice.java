package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
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
    private String invoiceName;

    @Column(nullable = false)
    private String customerName;

    @Column(columnDefinition = "TEXT")
    private String customerAddress;

    @Column(nullable = false)
    private String supplierName;

    @Column(columnDefinition = "TEXT")
    private String supplierAddress;

    @Column(nullable = false)
    private String employeeName;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal rate;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false)
    private LocalDate fromDate;

    @Column(nullable = false)
    private LocalDate toDate;

    @Column(nullable = false)
    private Integer hoursSpent;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] pdfData;

    private String pdfFileName;

    // Attachments - storing up to 4 attachments
    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] attachment1Data;

    private String attachment1FileName;

    private String attachment1ContentType;

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

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (invoiceId == null) {
            invoiceId = "INV-" + System.currentTimeMillis();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
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
}