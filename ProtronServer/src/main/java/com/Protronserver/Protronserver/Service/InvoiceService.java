package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.InvoiceRequestDTO;
import com.Protronserver.Protronserver.Entities.Invoice;
import com.Protronserver.Protronserver.Repository.InvoiceRepository;
import com.Protronserver.Protronserver.DTOs.InvoiceResponseDTO;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class InvoiceService {

    private static final Logger log = LoggerFactory.getLogger(InvoiceService.class);

    @Autowired
    private InvoiceRepository invoiceRepository;

    /**
     * Generates a custom invoice ID in format: INV-MMDDYYYY-100001
     * 
     * @return Generated invoice ID
     */
    private String generateInvoiceId() {
        LocalDate today = LocalDate.now();

        // Format: MMDDYYYY
        String datePrefix = today.format(DateTimeFormatter.ofPattern("MMddyyyy"));

        // Convert LocalDate to LocalDateTime for proper query parameters
        LocalDateTime startOfDay = today.atStartOfDay(); // 00:00:00
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay(); // Next day 00:00:00

        // Count invoices created today
        long todayInvoiceCount = invoiceRepository.countInvoicesCreatedToday(startOfDay, endOfDay);

        // Generate sequence number starting from 100001
        long sequenceNumber = 100001 + todayInvoiceCount;

        // Construct final invoice ID
        String invoiceId = String.format("INV-%s-%d", datePrefix, sequenceNumber);

        // Ensure uniqueness (in case of race conditions)
        while (invoiceRepository.existsByInvoiceId(invoiceId)) {
            sequenceNumber++;
            invoiceId = String.format("INV-%s-%d", datePrefix, sequenceNumber);
        }

        log.info("Generated invoice ID: {} (Today's count: {})", invoiceId, todayInvoiceCount);
        return invoiceId;
    }

    @Transactional
    public InvoiceResponseDTO createInvoice(InvoiceRequestDTO requestDTO) {
        try {
            // Calculate total amount if not provided
            BigDecimal totalAmount = requestDTO.getTotalAmount();
            if (totalAmount == null) {
                totalAmount = requestDTO.getRate().multiply(new BigDecimal(requestDTO.getHoursSpent()));
            }

            // Create invoice entity
            Invoice invoice = new Invoice();

            // Generate custom invoice ID
            String customInvoiceId = generateInvoiceId();
            invoice.setInvoiceId(customInvoiceId);

            invoice.setInvoiceName(requestDTO.getInvoiceName());
            invoice.setCustomerName(requestDTO.getCustomerName());
            invoice.setCustomerAddress(requestDTO.getCustomerAddress());
            invoice.setSupplierName(requestDTO.getSupplierName());
            invoice.setSupplierAddress(requestDTO.getSupplierAddress());
            invoice.setEmployeeName(requestDTO.getEmployeeName());
            invoice.setRate(requestDTO.getRate());
            invoice.setCurrency(requestDTO.getCurrency());
            invoice.setFromDate(requestDTO.getFromDate());
            invoice.setToDate(requestDTO.getToDate());
            invoice.setHoursSpent(requestDTO.getHoursSpent());
            invoice.setTotalAmount(totalAmount);
            invoice.setRemarks(requestDTO.getRemarks());

            // Generate PDF
            byte[] pdfBytes = generateInvoicePDF(invoice);
            invoice.setPdfData(pdfBytes);
            invoice.setPdfFileName(customInvoiceId + ".pdf");

            // Save to database
            Invoice savedInvoice = invoiceRepository.save(invoice);

            log.info("Invoice created successfully with ID: {}", savedInvoice.getInvoiceId());
            return convertToResponseDTO(savedInvoice);

        } catch (Exception e) {
            log.error("Error creating invoice: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create invoice: " + e.getMessage());
        }
    }

    @Transactional
    public InvoiceResponseDTO createInvoiceWithAttachments(InvoiceRequestDTO requestDTO,
            List<MultipartFile> attachments) {
        try {
            // Calculate total amount if not provided
            BigDecimal totalAmount = requestDTO.getTotalAmount();
            if (totalAmount == null) {
                totalAmount = requestDTO.getRate().multiply(new BigDecimal(requestDTO.getHoursSpent()));
            }

            // Create invoice entity
            Invoice invoice = new Invoice();

            // Generate custom invoice ID
            String customInvoiceId = generateInvoiceId();
            invoice.setInvoiceId(customInvoiceId);

            invoice.setInvoiceName(requestDTO.getInvoiceName());
            invoice.setCustomerName(requestDTO.getCustomerName());
            invoice.setCustomerAddress(requestDTO.getCustomerAddress());
            invoice.setSupplierName(requestDTO.getSupplierName());
            invoice.setSupplierAddress(requestDTO.getSupplierAddress());
            invoice.setEmployeeName(requestDTO.getEmployeeName());
            invoice.setRate(requestDTO.getRate());
            invoice.setCurrency(requestDTO.getCurrency());
            invoice.setFromDate(requestDTO.getFromDate());
            invoice.setToDate(requestDTO.getToDate());
            invoice.setHoursSpent(requestDTO.getHoursSpent());
            invoice.setTotalAmount(totalAmount);
            invoice.setRemarks(requestDTO.getRemarks());

            // Process attachments (up to 4)
            if (attachments != null && !attachments.isEmpty()) {
                processAttachments(invoice, attachments);
            }

            // Generate PDF
            byte[] pdfBytes = generateInvoicePDF(invoice);
            invoice.setPdfData(pdfBytes);
            invoice.setPdfFileName(customInvoiceId + ".pdf");

            // Save to database
            Invoice savedInvoice = invoiceRepository.save(invoice);

            log.info("Invoice created successfully with ID: {} and {} attachments",
                    savedInvoice.getInvoiceId(), savedInvoice.getAttachmentCount());
            return convertToResponseDTO(savedInvoice);

        } catch (Exception e) {
            log.error("Error creating invoice with attachments: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create invoice: " + e.getMessage());
        }
    }

    private void processAttachments(Invoice invoice, List<MultipartFile> attachments) throws IOException {
        int maxAttachments = Math.min(attachments.size(), 4);

        for (int i = 0; i < maxAttachments; i++) {
            MultipartFile file = attachments.get(i);
            if (file != null && !file.isEmpty()) {
                // Validate file size (10MB limit)
                if (file.getSize() > 10 * 1024 * 1024) {
                    throw new RuntimeException("File " + file.getOriginalFilename() + " exceeds 10MB limit");
                }

                // Validate file type
                String contentType = file.getContentType();
                if (!isAllowedFileType(contentType)) {
                    throw new RuntimeException("File type not allowed: " + contentType);
                }

                byte[] fileData = file.getBytes();
                String fileName = file.getOriginalFilename();

                // Store attachment based on index
                switch (i) {
                    case 0:
                        invoice.setAttachment1Data(fileData);
                        invoice.setAttachment1FileName(fileName);
                        invoice.setAttachment1ContentType(contentType);
                        break;
                    case 1:
                        invoice.setAttachment2Data(fileData);
                        invoice.setAttachment2FileName(fileName);
                        invoice.setAttachment2ContentType(contentType);
                        break;
                    case 2:
                        invoice.setAttachment3Data(fileData);
                        invoice.setAttachment3FileName(fileName);
                        invoice.setAttachment3ContentType(contentType);
                        break;
                    case 3:
                        invoice.setAttachment4Data(fileData);
                        invoice.setAttachment4FileName(fileName);
                        invoice.setAttachment4ContentType(contentType);
                        break;
                }
            }
        }
    }

    private boolean isAllowedFileType(String contentType) {
        if (contentType == null)
            return false;

        return contentType.equals("application/pdf") ||
                contentType.equals("application/msword") ||
                contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
                contentType.equals("text/plain") ||
                contentType.startsWith("image/");
    }

    public ByteArrayResource downloadAttachment(String invoiceId, int attachmentNumber) {
        Optional<Invoice> invoiceOpt = invoiceRepository.findByInvoiceId(invoiceId);
        if (invoiceOpt.isPresent()) {
            Invoice invoice = invoiceOpt.get();

            switch (attachmentNumber) {
                case 1:
                    if (invoice.getAttachment1Data() != null) {
                        return new ByteArrayResource(invoice.getAttachment1Data());
                    }
                    break;
                case 2:
                    if (invoice.getAttachment2Data() != null) {
                        return new ByteArrayResource(invoice.getAttachment2Data());
                    }
                    break;
                case 3:
                    if (invoice.getAttachment3Data() != null) {
                        return new ByteArrayResource(invoice.getAttachment3Data());
                    }
                    break;
                case 4:
                    if (invoice.getAttachment4Data() != null) {
                        return new ByteArrayResource(invoice.getAttachment4Data());
                    }
                    break;
            }
        }
        throw new RuntimeException("Attachment " + attachmentNumber + " not found for invoice ID: " + invoiceId);
    }

    public String getAttachmentFileName(String invoiceId, int attachmentNumber) {
        Optional<Invoice> invoiceOpt = invoiceRepository.findByInvoiceId(invoiceId);
        if (invoiceOpt.isPresent()) {
            Invoice invoice = invoiceOpt.get();

            switch (attachmentNumber) {
                case 1:
                    return invoice.getAttachment1FileName();
                case 2:
                    return invoice.getAttachment2FileName();
                case 3:
                    return invoice.getAttachment3FileName();
                case 4:
                    return invoice.getAttachment4FileName();
            }
        }
        return "attachment_" + attachmentNumber;
    }

    public String getAttachmentContentType(String invoiceId, int attachmentNumber) {
        Optional<Invoice> invoiceOpt = invoiceRepository.findByInvoiceId(invoiceId);
        if (invoiceOpt.isPresent()) {
            Invoice invoice = invoiceOpt.get();

            switch (attachmentNumber) {
                case 1:
                    return invoice.getAttachment1ContentType();
                case 2:
                    return invoice.getAttachment2ContentType();
                case 3:
                    return invoice.getAttachment3ContentType();
                case 4:
                    return invoice.getAttachment4ContentType();
            }
        }
        return "application/octet-stream";
    }

    public List<InvoiceResponseDTO> getAllInvoices() {
        return invoiceRepository.findAll().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    public Optional<InvoiceResponseDTO> getInvoiceById(Long id) {
        return invoiceRepository.findById(id)
                .map(this::convertToResponseDTO);
    }

    public Optional<InvoiceResponseDTO> getInvoiceByInvoiceId(String invoiceId) {
        return invoiceRepository.findByInvoiceId(invoiceId)
                .map(this::convertToResponseDTO);
    }

    public ByteArrayResource downloadInvoicePDF(String invoiceId) {
        Optional<Invoice> invoiceOpt = invoiceRepository.findByInvoiceId(invoiceId);
        if (invoiceOpt.isPresent() && invoiceOpt.get().getPdfData() != null) {
            return new ByteArrayResource(invoiceOpt.get().getPdfData());
        }
        throw new RuntimeException("Invoice PDF not found for ID: " + invoiceId);
    }

    public List<InvoiceResponseDTO> searchInvoicesByCustomer(String customerName) {
        return invoiceRepository.findByCustomerNameContainingIgnoreCase(customerName).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    private byte[] generateInvoicePDF(Invoice invoice) throws DocumentException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document();
        PdfWriter.getInstance(document, baos);

        document.open();

        // Add title
        Font titleFont = new Font(Font.FontFamily.HELVETICA, 20, Font.BOLD);
        Paragraph title = new Paragraph("INVOICE", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(20);
        document.add(title);

        // Invoice details
        Font headerFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD);
        Font normalFont = new Font(Font.FontFamily.HELVETICA, 10);

        // Invoice ID and Name
        document.add(new Paragraph("Invoice ID: " + invoice.getInvoiceId(), headerFont));
        document.add(new Paragraph("Invoice Name: " + invoice.getInvoiceName(), normalFont));
        document.add(new Paragraph(" "));

        // Customer and Supplier details table
        PdfPTable detailsTable = new PdfPTable(2);
        detailsTable.setWidthPercentage(100);
        detailsTable.setSpacingAfter(20);

        // Customer details
        detailsTable.addCell(new Phrase("Customer Name: " + invoice.getCustomerName(), headerFont));
        detailsTable.addCell(new Phrase("Supplier Name: " + invoice.getSupplierName(), headerFont));
        detailsTable.addCell(new Phrase(
                "Customer Address: " + (invoice.getCustomerAddress() != null ? invoice.getCustomerAddress() : ""),
                normalFont));
        detailsTable.addCell(new Phrase(
                "Supplier Address: " + (invoice.getSupplierAddress() != null ? invoice.getSupplierAddress() : ""),
                normalFont));

        document.add(detailsTable);

        // Work details table
        PdfPTable workTable = new PdfPTable(2);
        workTable.setWidthPercentage(100);
        workTable.setSpacingAfter(20);

        workTable.addCell(new Phrase("Employee Name:", headerFont));
        workTable.addCell(new Phrase(invoice.getEmployeeName(), normalFont));
        workTable.addCell(new Phrase("Rate:", headerFont));
        workTable.addCell(new Phrase(invoice.getCurrency() + " " + invoice.getRate().toString(), normalFont));
        workTable.addCell(new Phrase("From Date:", headerFont));
        workTable.addCell(
                new Phrase(invoice.getFromDate().format(DateTimeFormatter.ofPattern("MM/dd/yyyy")), normalFont));
        workTable.addCell(new Phrase("To Date:", headerFont));
        workTable
                .addCell(new Phrase(invoice.getToDate().format(DateTimeFormatter.ofPattern("MM/dd/yyyy")), normalFont));
        workTable.addCell(new Phrase("Hours Spent:", headerFont));
        workTable.addCell(new Phrase(invoice.getHoursSpent().toString(), normalFont));

        document.add(workTable);

        // Total amount
        Font totalFont = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD);
        Paragraph total = new Paragraph(
                "Total Amount: " + invoice.getCurrency() + " " + invoice.getTotalAmount().toString(), totalFont);
        total.setAlignment(Element.ALIGN_RIGHT);
        total.setSpacingAfter(20);
        document.add(total);

        // Attachments info
        if (invoice.getAttachmentCount() > 0) {
            document.add(new Paragraph("Attachments:", headerFont));
            List<String> attachmentNames = invoice.getAttachmentFileNames();
            for (String fileName : attachmentNames) {
                document.add(new Paragraph("• " + fileName, normalFont));
            }
            document.add(new Paragraph(" "));
        }

        // Remarks
        if (invoice.getRemarks() != null && !invoice.getRemarks().trim().isEmpty()) {
            document.add(new Paragraph("Remarks:", headerFont));
            document.add(new Paragraph(invoice.getRemarks(), normalFont));
        }

        document.close();
        return baos.toByteArray();
    }

    private InvoiceResponseDTO convertToResponseDTO(Invoice invoice) {
        InvoiceResponseDTO dto = new InvoiceResponseDTO();
        dto.setId(invoice.getId());
        dto.setInvoiceId(invoice.getInvoiceId());
        dto.setInvoiceName(invoice.getInvoiceName());
        dto.setCustomerName(invoice.getCustomerName());
        dto.setCustomerAddress(invoice.getCustomerAddress());
        dto.setSupplierName(invoice.getSupplierName());
        dto.setSupplierAddress(invoice.getSupplierAddress());
        dto.setEmployeeName(invoice.getEmployeeName());
        dto.setRate(invoice.getRate());
        dto.setCurrency(invoice.getCurrency());
        dto.setFromDate(invoice.getFromDate());
        dto.setToDate(invoice.getToDate());
        dto.setHoursSpent(invoice.getHoursSpent());
        dto.setTotalAmount(invoice.getTotalAmount());
        dto.setRemarks(invoice.getRemarks());
        dto.setPdfFileName(invoice.getPdfFileName());
        dto.setCreatedAt(invoice.getCreatedAt() != null ? invoice.getCreatedAt().toLocalDate() : null);

        // Add attachment info
        dto.setAttachmentCount(invoice.getAttachmentCount());
        dto.setAttachmentFileNames(invoice.getAttachmentFileNames());

        return dto;
    }
}