package com.Protronserver.Protronserver.DTOs;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponseDTO {

    private Long id;
    private String invoiceId;
    private String invoiceName;
    private String customerName;
    private String customerAddress;
    private String supplierName;
    private String supplierAddress;
    private String employeeName;
    private BigDecimal rate;
    private String currency;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fromDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate toDate;

    private Integer hoursSpent;
    private BigDecimal totalAmount;
    private String remarks;
    private String pdfFileName;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate createdAt;

    // Attachment information
    private Integer attachmentCount;
    private List<String> attachmentFileNames;

    // Helper method to check if invoice has attachments
    public boolean hasAttachments() {
        return attachmentCount != null && attachmentCount > 0;
    }
}