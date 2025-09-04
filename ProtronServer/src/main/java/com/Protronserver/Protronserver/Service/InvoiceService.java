package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.InvoiceRequestDTO;
import com.Protronserver.Protronserver.Entities.Invoice;
import com.Protronserver.Protronserver.Repository.InvoiceRepository;
import com.Protronserver.Protronserver.DTOs.InvoiceResponseDTO;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
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
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.Protronserver.Protronserver.Entities.Project;
import com.Protronserver.Protronserver.Repository.ProjectRepository;
import java.util.HashMap;

@Service
public class InvoiceService {

    private static final Logger log = LoggerFactory.getLogger(InvoiceService.class);

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private ProjectRepository projectRepository;

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
            invoice.setCustomerInfo(requestDTO.getCustomerInfo());
            invoice.setSupplierInfo(requestDTO.getSupplierInfo());
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
            invoice.setProjectName(requestDTO.getProjectName());
            invoice.setCreatedAt(LocalDateTime.now());

            // Generate PDF
            byte[] pdfBytes = generateInvoicePDF(invoice, requestDTO.getTimesheetData());
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
            invoice.setCustomerInfo(requestDTO.getCustomerInfo());
            invoice.setSupplierInfo(requestDTO.getSupplierInfo());
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
            invoice.setProjectName(requestDTO.getProjectName());
            invoice.setCreatedAt(LocalDateTime.now());

            // Process attachments (up to 4)
            if (attachments != null && !attachments.isEmpty()) {
                processAttachments(invoice, attachments);
            }

            // Generate PDF
            byte[] pdfBytes = generateInvoicePDF(invoice, requestDTO.getTimesheetData());
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
        if (contentType == null) {
            return false;
        }

        return contentType.equals("application/pdf")
                || contentType.equals("application/msword")
                || contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                || contentType.equals("text/plain")
                || contentType.startsWith("image/");
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

    private byte[] generateInvoicePDF(Invoice invoice, InvoiceRequestDTO.TimesheetDataDTO timesheetData)
            throws DocumentException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document();
        PdfWriter.getInstance(document, baos);

        document.open();

        // Define fonts
        Font titleFont = new Font(Font.FontFamily.HELVETICA, 20, Font.BOLD);
        Font headerFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD);
        Font normalFont = new Font(Font.FontFamily.HELVETICA, 10);
        Font smallFont = new Font(Font.FontFamily.HELVETICA, 8);

        // Add title
        Paragraph title = new Paragraph("INVOICE", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(20);
        document.add(title);

        // Invoice ID and Name
        document.add(new Paragraph("Invoice ID: " + invoice.getInvoiceId(), normalFont));
        document.add(new Paragraph("Invoice Name: " + invoice.getInvoiceName(), normalFont));
        String createdAtFormatted = formatLocalDateTimeWithSuffix(invoice.getCreatedAt());
        document.add(new Paragraph("Created At: " + createdAtFormatted, normalFont));
        document.add(new Paragraph(" "));

        // Customer and Supplier details table
        PdfPTable detailsTable = new PdfPTable(2);
        detailsTable.setWidthPercentage(100);
        detailsTable.setSpacingAfter(20);

        // Customer details
        detailsTable.addCell(new Phrase("Customer Name: " + invoice.getCustomerName(), normalFont));
        detailsTable.addCell(new Phrase("Supplier Name: " + invoice.getSupplierName(), normalFont));
        detailsTable.addCell(new Phrase(
                "Customer Address: " + (invoice.getCustomerAddress() != null ? invoice.getCustomerAddress() : ""),
                normalFont));
        detailsTable.addCell(new Phrase(
                "Supplier Address: " + (invoice.getSupplierAddress() != null ? invoice.getSupplierAddress() : ""),
                normalFont));
        // Additional info under addresses
        detailsTable.addCell(new Phrase(
                "Customer Info: " + (invoice.getCustomerInfo() != null ? invoice.getCustomerInfo() : ""),
                normalFont));
        detailsTable.addCell(new Phrase(
                "Supplier Info: " + (invoice.getSupplierInfo() != null ? invoice.getSupplierInfo() : ""),
                normalFont));

        document.add(detailsTable);

        // Work details table
        PdfPTable workTable = new PdfPTable(2);
        workTable.setWidthPercentage(100);
        workTable.setSpacingAfter(20);

        workTable.addCell(new Phrase("Employee Name:", normalFont));
        workTable.addCell(new Phrase(invoice.getEmployeeName(), normalFont));
        workTable.addCell(new Phrase("Rate:", normalFont));
        workTable.addCell(new Phrase(invoice.getCurrency() + " " + invoice.getRate().toString(), normalFont));
        workTable.addCell(new Phrase("From Date:", normalFont));
        workTable.addCell(new Phrase(formatDateWithSuffix(invoice.getFromDate()), normalFont));
        workTable.addCell(new Phrase("To Date:", normalFont));
        workTable.addCell(new Phrase(formatDateWithSuffix(invoice.getToDate()), normalFont));
        workTable.addCell(new Phrase("Project Name:", normalFont));
        workTable.addCell(new Phrase(invoice.getProjectName() != null ? invoice.getProjectName() : "N/A", normalFont));

        document.add(workTable);

        // Attachments info
        // ==================== REMARKS TABLE ====================
        PdfPTable remarksTable = new PdfPTable(2);
        remarksTable.setWidthPercentage(100);
        remarksTable.setWidths(new float[] { 8f, 2f });
        remarksTable.setLockedWidth(false); // allow width to be % based
        remarksTable.setSplitLate(false); // ensure footer stays on same page
        remarksTable.setKeepTogether(true); // try to keep table together on one page

        // --- HEADER ---
        PdfPCell h1 = new PdfPCell(new Phrase("Item Description", headerFont));
        h1.setHorizontalAlignment(Element.ALIGN_CENTER);
        h1.setVerticalAlignment(Element.ALIGN_MIDDLE);
        h1.setPadding(8);
        h1.setBackgroundColor(BaseColor.LIGHT_GRAY);
        h1.setBorder(Rectangle.BOX);
        h1.setFixedHeight(35f); // Fixed header height
        remarksTable.addCell(h1);

        PdfPCell h2 = new PdfPCell(new Phrase("Amount", headerFont));
        h2.setHorizontalAlignment(Element.ALIGN_CENTER);
        h2.setVerticalAlignment(Element.ALIGN_MIDDLE);
        h2.setPadding(8);
        h2.setBackgroundColor(BaseColor.LIGHT_GRAY);
        h2.setBorder(Rectangle.BOX);
        h2.setFixedHeight(35f); // Fixed header height
        remarksTable.addCell(h2);

        // --- DATA ROW ---
        String description = (invoice.getEmployeeName() != null ? invoice.getEmployeeName() : "");

        if (invoice.getRemarks() != null && !invoice.getRemarks().trim().isEmpty()) {
            description += "\n" + invoice.getRemarks();
        }

        PdfPCell c1 = new PdfPCell(new Phrase(description, normalFont));
        c1.setPadding(8);
        c1.setVerticalAlignment(Element.ALIGN_TOP);
        c1.setBorder(Rectangle.LEFT | Rectangle.RIGHT | Rectangle.TOP);
        // Set a reasonable fixed height instead of letting it expand
        c1.setFixedHeight(80f); // Adjust this value based on your content
        c1.setNoWrap(false); // Allow text wrapping
        remarksTable.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(invoice.getCurrency() + " " + invoice.getTotalAmount(), normalFont));
        c2.setPadding(8);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c2.setVerticalAlignment(Element.ALIGN_TOP);
        c2.setBorder(Rectangle.LEFT | Rectangle.RIGHT | Rectangle.TOP);
        c2.setFixedHeight(80f); // Match the height of description cell
        remarksTable.addCell(c2);

        // --- FILLER ROW to occupy remaining height (reduced size) ---
        PdfPCell filler1 = new PdfPCell(new Phrase(""));
        filler1.setBorder(Rectangle.LEFT | Rectangle.RIGHT);
        // Reduced filler height to prevent page overflow
        float fillerHeight = invoice.getAttachmentCount() >= 2 ? 200f : 200f;
        filler1.setFixedHeight(fillerHeight);
        remarksTable.addCell(filler1);

        PdfPCell filler2 = new PdfPCell(new Phrase(""));
        filler2.setBorder(Rectangle.LEFT | Rectangle.RIGHT);
        filler2.setFixedHeight(fillerHeight); // Match filler1 height
        remarksTable.addCell(filler2);

        // --- FOOTER ROW ---
        PdfPCell footerLabel = new PdfPCell(new Phrase("Total", headerFont));
        footerLabel.setPadding(8);
        footerLabel.setHorizontalAlignment(Element.ALIGN_RIGHT);
        footerLabel.setVerticalAlignment(Element.ALIGN_MIDDLE);
        footerLabel.setBorder(Rectangle.TOP | Rectangle.LEFT | Rectangle.BOTTOM);
        footerLabel.setBackgroundColor(BaseColor.LIGHT_GRAY);
        footerLabel.setFixedHeight(40f); // Fixed footer height

        PdfPCell footerValue = new PdfPCell(
                new Phrase(invoice.getCurrency() + " " + invoice.getTotalAmount(), headerFont));
        footerValue.setPadding(8);
        footerValue.setHorizontalAlignment(Element.ALIGN_RIGHT);
        footerValue.setVerticalAlignment(Element.ALIGN_MIDDLE);
        footerValue.setBorder(Rectangle.TOP | Rectangle.RIGHT | Rectangle.BOTTOM);
        footerValue.setBackgroundColor(BaseColor.LIGHT_GRAY);
        footerValue.setFixedHeight(40f); // Fixed footer height

        remarksTable.addCell(footerLabel);
        remarksTable.addCell(footerValue);

        // --- ADD TO DOCUMENT ---
        document.add(remarksTable);

        if (timesheetData != null && timesheetData.getEntries() != null && !timesheetData.getEntries().isEmpty()) {
            document.newPage();
            addTimesheetSection(document, timesheetData, headerFont, normalFont, smallFont);
        }

        document.close();
        return baos.toByteArray();
    }

    public byte[] generatePreviewPDF(Map<String, Object> invoiceData) throws DocumentException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document();
        PdfWriter.getInstance(document, baos);

        document.open();

        // Define fonts
        Font titleFont = new Font(Font.FontFamily.HELVETICA, 20, Font.BOLD);
        Font headerFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD);
        Font normalFont = new Font(Font.FontFamily.HELVETICA, 10);
        Font smallFont = new Font(Font.FontFamily.HELVETICA, 8);

        // Add title
        Paragraph title = new Paragraph("INVOICE", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(20);
        document.add(title);

        // Invoice ID and Name - Handle null values
        document.add(new Paragraph("Invoice ID: " + generateInvoiceId(), normalFont));
        document.add(new Paragraph("Invoice Name: " +
                (invoiceData.get("invoiceName") != null ? invoiceData.get("invoiceName").toString() : ""), normalFont));
        String createdAtFormatted = formatLocalDateTimeWithSuffix(LocalDateTime.now());
        document.add(new Paragraph("Created At: " + createdAtFormatted, normalFont));
        document.add(new Paragraph(" "));

        // Customer and Supplier details table
        PdfPTable detailsTable = new PdfPTable(2);
        detailsTable.setWidthPercentage(100);
        detailsTable.setSpacingAfter(20);

        // Customer details - Handle null values
        detailsTable.addCell(new Phrase("Customer Name: " +
                (invoiceData.get("customerName") != null ? invoiceData.get("customerName").toString() : ""),
                normalFont));
        detailsTable.addCell(new Phrase("Supplier Name: " +
                (invoiceData.get("supplierName") != null ? invoiceData.get("supplierName").toString() : ""),
                normalFont));
        detailsTable.addCell(new Phrase("Customer Address: " +
                (invoiceData.get("customerAddress") != null ? invoiceData.get("customerAddress").toString() : ""),
                normalFont));
        detailsTable.addCell(new Phrase("Supplier Address: " +
                (invoiceData.get("supplierAddress") != null ? invoiceData.get("supplierAddress").toString() : ""),
                normalFont));

        // Additional info under addresses
        detailsTable.addCell(new Phrase("Customer Info: " +
                (invoiceData.get("customerInfo") != null ? invoiceData.get("customerInfo").toString() : ""),
                normalFont));
        detailsTable.addCell(new Phrase("Supplier Info: " +
                (invoiceData.get("supplierInfo") != null ? invoiceData.get("supplierInfo").toString() : ""),
                normalFont));

        document.add(detailsTable);

        // Work details table
        PdfPTable workTable = new PdfPTable(2);
        workTable.setWidthPercentage(100);
        workTable.setSpacingAfter(20);

        workTable.addCell(new Phrase("Employee Name:", headerFont));
        workTable.addCell(new Phrase(
                (invoiceData.get("employeeName") != null ? invoiceData.get("employeeName").toString() : ""),
                normalFont));

        workTable.addCell(new Phrase("Rate:", normalFont));
        String currency = invoiceData.get("currency") != null ? invoiceData.get("currency").toString() : "";
        String rate = invoiceData.get("rate") != null ? invoiceData.get("rate").toString() : "";
        workTable.addCell(new Phrase(currency + (currency.isEmpty() || rate.isEmpty() ? "" : " ") + rate, normalFont));

        // Handle date parsing with null safety
        LocalDate fromDate = null;
        LocalDate toDate = null;

        try {
            fromDate = invoiceData.get("fromDate") != null
                    ? LocalDate.parse(invoiceData.get("fromDate").toString())
                    : null;
        } catch (Exception e) {
            // If parsing fails, fromDate remains null
        }

        try {
            toDate = invoiceData.get("toDate") != null
                    ? LocalDate.parse(invoiceData.get("toDate").toString())
                    : null;
        } catch (Exception e) {
            // If parsing fails, toDate remains null
        }

        workTable.addCell(new Phrase("From Date:", normalFont));
        workTable.addCell(new Phrase(formatDateWithSuffix(fromDate), normalFont));
        workTable.addCell(new Phrase("To Date:", normalFont));
        workTable.addCell(new Phrase(formatDateWithSuffix(toDate), normalFont));
        workTable.addCell(new Phrase("Project Name:", normalFont));
        workTable.addCell(new Phrase(
                (invoiceData.get("projectName") != null ? invoiceData.get("projectName").toString() : "N/A"),
                normalFont));
        document.add(workTable);

        // ==================== REMARKS TABLE ====================
        PdfPTable remarksTable = new PdfPTable(2);
        remarksTable.setWidthPercentage(100);
        remarksTable.setWidths(new float[] { 8f, 2f });
        remarksTable.setLockedWidth(false); // allow width to be % based
        remarksTable.setSplitLate(false); // ensure footer stays on same page
        remarksTable.setKeepTogether(true); // try to keep table together on one page

        // --- HEADER ---
        PdfPCell h1 = new PdfPCell(new Phrase("Item Description", headerFont));
        h1.setHorizontalAlignment(Element.ALIGN_CENTER);
        h1.setVerticalAlignment(Element.ALIGN_MIDDLE);
        h1.setPadding(8);
        h1.setBackgroundColor(BaseColor.LIGHT_GRAY);
        h1.setBorder(Rectangle.BOX);
        h1.setFixedHeight(35f); // Fixed header height
        remarksTable.addCell(h1);

        PdfPCell h2 = new PdfPCell(new Phrase("Amount", headerFont));
        h2.setHorizontalAlignment(Element.ALIGN_CENTER);
        h2.setVerticalAlignment(Element.ALIGN_MIDDLE);
        h2.setPadding(8);
        h2.setBackgroundColor(BaseColor.LIGHT_GRAY);
        h2.setBorder(Rectangle.BOX);
        h2.setFixedHeight(35f); // Fixed header height
        remarksTable.addCell(h2);

        // --- DATA ROW ---
        String description = "";

        // Build description with null safety
        if (invoiceData.get("employeeName") != null) {
            description = invoiceData.get("employeeName").toString();
        }

        if (invoiceData.get("remarks") != null) {
            String remarks = invoiceData.get("remarks").toString();
            if (!remarks.trim().isEmpty()) {
                if (!description.isEmpty()) {
                    description += "\n";
                }
                description += remarks;
            }
        }

        PdfPCell c1 = new PdfPCell(new Phrase(description, normalFont));
        c1.setPadding(8);
        c1.setVerticalAlignment(Element.ALIGN_TOP);
        c1.setBorder(Rectangle.LEFT | Rectangle.RIGHT | Rectangle.TOP);
        c1.setFixedHeight(80f); // Adjust this value based on your content
        c1.setNoWrap(false); // Allow text wrapping
        remarksTable.addCell(c1);

        // Handle amount with null safety
        String currencyForAmount = invoiceData.get("currency") != null ? invoiceData.get("currency").toString() : "";
        String totalAmount = invoiceData.get("totalAmount") != null ? invoiceData.get("totalAmount").toString() : "";
        String amountDisplay = currencyForAmount + (currencyForAmount.isEmpty() || totalAmount.isEmpty() ? "" : " ")
                + totalAmount;

        PdfPCell c2 = new PdfPCell(new Phrase(amountDisplay, normalFont));
        c2.setPadding(8);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c2.setVerticalAlignment(Element.ALIGN_TOP);
        c2.setBorder(Rectangle.LEFT | Rectangle.RIGHT | Rectangle.TOP);
        c2.setFixedHeight(80f); // Match the height of description cell
        remarksTable.addCell(c2);

        // --- FILLER ROW to occupy remaining height (reduced size) ---
        PdfPCell filler1 = new PdfPCell(new Phrase(""));
        filler1.setBorder(Rectangle.LEFT | Rectangle.RIGHT);
        float fillerHeight = 200f;
        filler1.setFixedHeight(fillerHeight);
        remarksTable.addCell(filler1);

        PdfPCell filler2 = new PdfPCell(new Phrase(""));
        filler2.setBorder(Rectangle.LEFT | Rectangle.RIGHT);
        filler2.setFixedHeight(fillerHeight); // Match filler1 height
        remarksTable.addCell(filler2);

        // --- FOOTER ROW ---
        PdfPCell footerLabel = new PdfPCell(new Phrase("Total", headerFont));
        footerLabel.setPadding(8);
        footerLabel.setHorizontalAlignment(Element.ALIGN_RIGHT);
        footerLabel.setVerticalAlignment(Element.ALIGN_MIDDLE);
        footerLabel.setBorder(Rectangle.TOP | Rectangle.LEFT | Rectangle.BOTTOM);
        footerLabel.setBackgroundColor(BaseColor.LIGHT_GRAY);
        footerLabel.setFixedHeight(40f); // Fixed footer height

        // Use the same amount display for footer
        PdfPCell footerValue = new PdfPCell(new Phrase(amountDisplay, headerFont));
        footerValue.setPadding(8);
        footerValue.setHorizontalAlignment(Element.ALIGN_RIGHT);
        footerValue.setVerticalAlignment(Element.ALIGN_MIDDLE);
        footerValue.setBorder(Rectangle.TOP | Rectangle.RIGHT | Rectangle.BOTTOM);
        footerValue.setBackgroundColor(BaseColor.LIGHT_GRAY);
        footerValue.setFixedHeight(40f); // Fixed footer height

        remarksTable.addCell(footerLabel);
        remarksTable.addCell(footerValue);

        // --- ADD TO DOCUMENT ---
        document.add(remarksTable);

        // Handle timesheet data with null safety
        if (invoiceData.get("timesheetData") instanceof Map) {
            Map<String, Object> tsData = (Map<String, Object>) invoiceData.get("timesheetData");
            Object entriesObj = tsData.get("entries");
            if (entriesObj instanceof List && !((List<?>) entriesObj).isEmpty()) {
                document.newPage();
                addTimesheetSectionFromMap(document, tsData, headerFont, normalFont, smallFont);
            }
        }

        document.close();
        return baos.toByteArray();
    }

    // Helper method to safely format dates (assuming this doesn't exist)

    private String formatLocalDateTimeWithSuffix(LocalDateTime dateTime) {
        int day = dateTime.getDayOfMonth();
        String daySuffix;
        if (day >= 11 && day <= 13) {
            daySuffix = "th";
        } else {
            switch (day % 10) {
                case 1:
                    daySuffix = "st";
                    break;
                case 2:
                    daySuffix = "nd";
                    break;
                case 3:
                    daySuffix = "rd";
                    break;
                default:
                    daySuffix = "th";
                    break;
            }
        }
        DateTimeFormatter monthYearFormatter = DateTimeFormatter.ofPattern("MMMM yyyy");
        return day + daySuffix + " " + dateTime.format(monthYearFormatter);
    }

    private String formatDateWithSuffix(LocalDate date) {
        if (date == null) {
            return ""; // Return empty string for null dates
        }

        int day = date.getDayOfMonth();
        String daySuffix;

        if (day >= 11 && day <= 13) {
            daySuffix = "th";
        } else {
            switch (day % 10) {
                case 1:
                    daySuffix = "st";
                    break;
                case 2:
                    daySuffix = "nd";
                    break;
                case 3:
                    daySuffix = "rd";
                    break;
                default:
                    daySuffix = "th";
            }
        }

        DateTimeFormatter monthYearFormatter = DateTimeFormatter.ofPattern("MMMM yyyy");
        return day + daySuffix + " " + date.format(monthYearFormatter);
    }

    /**
     * Add timesheet section to the PDF
     */
    private void addTimesheetSection(Document document, InvoiceRequestDTO.TimesheetDataDTO timesheetData,
            Font headerFont, Font normalFont, Font smallFont) throws DocumentException {

        // Timesheet header
        document.add(new Paragraph("\n"));
        Paragraph timesheetHeader = new Paragraph("TIMESHEET DETAILS (" + timesheetData.getViewMode() + " View)",
                headerFont);
        timesheetHeader.setAlignment(Element.ALIGN_CENTER);
        timesheetHeader.setSpacingAfter(10);
        document.add(timesheetHeader);

        // Timesheet summary
        PdfPTable summaryTable = new PdfPTable(3);
        summaryTable.setWidthPercentage(100);
        summaryTable.setSpacingAfter(15);

        // Summary headers
        PdfPCell periodCell = new PdfPCell(new Phrase("Period", headerFont));
        periodCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        summaryTable.addCell(periodCell);

        PdfPCell employeeCell = new PdfPCell(new Phrase("Employee", headerFont));
        employeeCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        summaryTable.addCell(employeeCell);

        PdfPCell totalHoursCell = new PdfPCell(new Phrase("Total Hours", headerFont));
        totalHoursCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        summaryTable.addCell(totalHoursCell);

        // Summary data
        summaryTable.addCell(new Phrase(timesheetData.getPeriod(), normalFont));
        summaryTable.addCell(new Phrase(timesheetData.getEmployeeName(), normalFont));
        summaryTable.addCell(
                new Phrase(timesheetData.getTotalHours() + "h " + timesheetData.getTotalMinutes() + "m", normalFont));

        document.add(summaryTable);

        // Detailed timesheet table
        document.add(new Paragraph("Detailed Time Entries:", headerFont));

        // Create table with appropriate columns based on view mode
        PdfPTable timesheetTable;
        if ("Weekly".equals(timesheetData.getViewMode())) {
            timesheetTable = new PdfPTable(7); // Date, Day, Task Type, Task Topic, Hours, Project, Description
            timesheetTable.setWidths(new float[] { 1.5f, 1f, 2f, 2f, 1f, 2f, 3f });
        } else {
            timesheetTable = new PdfPTable(6); // Date, Task Type, Task Topic, Hours, Project, Description
            timesheetTable.setWidths(new float[] { 1.5f, 2f, 2f, 1f, 2f, 3f });
        }

        timesheetTable.setWidthPercentage(100);
        timesheetTable.setSpacingAfter(15);

        // Table headers
        addTimesheetTableHeaders(timesheetTable, timesheetData.getViewMode(), headerFont);

        // Table data
        for (InvoiceRequestDTO.TimesheetEntryDTO entry : timesheetData.getEntries()) {
            addTimesheetTableRow(timesheetTable, entry, timesheetData.getViewMode(), normalFont, smallFont);
        }

        document.add(timesheetTable);
    }

    /**
     * Add timesheet section to the PDF for preview path (accepts Map payload)
     */
    private void addTimesheetSectionFromMap(Document document, Map<String, Object> timesheetData,
            Font headerFont, Font normalFont, Font smallFont) throws DocumentException {

        document.add(new Paragraph("\n"));
        String viewMode = String
                .valueOf(timesheetData.get("viewMode") != null ? timesheetData.get("viewMode") : "Custom");
        Paragraph timesheetHeader = new Paragraph("TIMESHEET DETAILS (" + viewMode + " View)", headerFont);
        timesheetHeader.setAlignment(Element.ALIGN_CENTER);
        timesheetHeader.setSpacingAfter(10);
        document.add(timesheetHeader);

        // Summary
        PdfPTable summaryTable = new PdfPTable(3);
        summaryTable.setWidthPercentage(100);
        summaryTable.setSpacingAfter(15);

        PdfPCell periodCell = new PdfPCell(new Phrase("Period", headerFont));
        periodCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        summaryTable.addCell(periodCell);

        PdfPCell employeeCell = new PdfPCell(new Phrase("Employee", headerFont));
        employeeCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        summaryTable.addCell(employeeCell);

        PdfPCell totalHoursCell = new PdfPCell(new Phrase("Total Hours", headerFont));
        totalHoursCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        summaryTable.addCell(totalHoursCell);

        String period = String.valueOf(timesheetData.get("period") != null ? timesheetData.get("period") : "");
        String employeeName = String
                .valueOf(timesheetData.get("employeeName") != null ? timesheetData.get("employeeName") : "");
        String totalHoursText = String
                .valueOf(timesheetData.get("totalHours") != null ? timesheetData.get("totalHours") : 0) + "h "
                + String.valueOf(timesheetData.get("totalMinutes") != null ? timesheetData.get("totalMinutes") : 0)
                + "m";

        summaryTable.addCell(new Phrase(period, normalFont));
        summaryTable.addCell(new Phrase(employeeName, normalFont));
        summaryTable.addCell(new Phrase(totalHoursText, normalFont));

        document.add(summaryTable);

        // Detailed entries
        boolean isWeekly = "Weekly".equalsIgnoreCase(viewMode);
        PdfPTable table = new PdfPTable(isWeekly ? 7 : 6);
        if (isWeekly) {
            table.setWidths(new float[] { 1.5f, 1f, 2f, 2f, 1f, 2f, 3f });
        } else {
            table.setWidths(new float[] { 1.5f, 2f, 2f, 1f, 2f, 3f });
        }
        table.setWidthPercentage(100);
        table.setSpacingAfter(15);

        // Headers
        PdfPCell dateHeader = new PdfPCell(new Phrase("Date", headerFont));
        dateHeader.setBackgroundColor(BaseColor.LIGHT_GRAY);
        dateHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(dateHeader);

        if (isWeekly) {
            PdfPCell dayHeader = new PdfPCell(new Phrase("Day", headerFont));
            dayHeader.setBackgroundColor(BaseColor.LIGHT_GRAY);
            dayHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(dayHeader);
        }

        PdfPCell taskTypeHeader = new PdfPCell(new Phrase("Task Type", headerFont));
        taskTypeHeader.setBackgroundColor(BaseColor.LIGHT_GRAY);
        taskTypeHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(taskTypeHeader);

        PdfPCell taskTopicHeader = new PdfPCell(new Phrase("Task Topic", headerFont));
        taskTopicHeader.setBackgroundColor(BaseColor.LIGHT_GRAY);
        taskTopicHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(taskTopicHeader);

        PdfPCell hoursHeader = new PdfPCell(new Phrase("Hours", headerFont));
        hoursHeader.setBackgroundColor(BaseColor.LIGHT_GRAY);
        hoursHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(hoursHeader);

        PdfPCell projectHeader = new PdfPCell(new Phrase("Project", headerFont));
        projectHeader.setBackgroundColor(BaseColor.LIGHT_GRAY);
        projectHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(projectHeader);

        PdfPCell descriptionHeader = new PdfPCell(new Phrase("Description", headerFont));
        descriptionHeader.setBackgroundColor(BaseColor.LIGHT_GRAY);
        descriptionHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(descriptionHeader);

        // Rows
        Object entriesObj = timesheetData.get("entries");
        if (entriesObj instanceof List) {
            List<?> entries = (List<?>) entriesObj;
            for (Object obj : entries) {
                if (!(obj instanceof Map))
                    continue;
                Map<?, ?> entry = (Map<?, ?>) obj;

                String date = String.valueOf(entry.get("date") != null ? entry.get("date") : "");
                String dayOfWeek = String.valueOf(entry.get("dayOfWeek") != null ? entry.get("dayOfWeek") : "");
                boolean isWeekend = Boolean.TRUE.equals(entry.get("isWeekend"));
                String taskType = String.valueOf(entry.get("taskType") != null ? entry.get("taskType") : "");
                String taskTopic = String.valueOf(entry.get("taskTopic") != null ? entry.get("taskTopic") : "");
                int hours = 0;
                int minutes = 0;
                try {
                    hours = Integer.parseInt(String.valueOf(entry.get("hours") != null ? entry.get("hours") : 0));
                } catch (Exception ignored) {
                }
                try {
                    minutes = Integer.parseInt(String.valueOf(entry.get("minutes") != null ? entry.get("minutes") : 0));
                } catch (Exception ignored) {
                }
                String project = String.valueOf(entry.get("project") != null ? entry.get("project") : "");
                String desc = String.valueOf(entry.get("description") != null ? entry.get("description") : "");

                PdfPCell dateCell = new PdfPCell(new Phrase(date, normalFont));
                if (isWeekend)
                    dateCell.setBackgroundColor(new BaseColor(245, 245, 245));
                table.addCell(dateCell);

                if (isWeekly) {
                    PdfPCell dayCell = new PdfPCell(new Phrase(dayOfWeek, smallFont));
                    if (isWeekend)
                        dayCell.setBackgroundColor(new BaseColor(245, 245, 245));
                    table.addCell(dayCell);
                }

                PdfPCell taskTypeCell = new PdfPCell(new Phrase(taskType, normalFont));
                if (isWeekend)
                    taskTypeCell.setBackgroundColor(new BaseColor(245, 245, 245));
                table.addCell(taskTypeCell);

                PdfPCell taskTopicCell = new PdfPCell(new Phrase(taskTopic, smallFont));
                if (isWeekend)
                    taskTopicCell.setBackgroundColor(new BaseColor(245, 245, 245));
                table.addCell(taskTopicCell);

                String hoursText = hours + "h " + minutes + "m";
                PdfPCell hoursCell = new PdfPCell(new Phrase(hoursText, normalFont));
                hoursCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                if (isWeekend)
                    hoursCell.setBackgroundColor(new BaseColor(245, 245, 245));
                table.addCell(hoursCell);

                PdfPCell projectCell = new PdfPCell(new Phrase(project, smallFont));
                if (isWeekend)
                    projectCell.setBackgroundColor(new BaseColor(245, 245, 245));
                table.addCell(projectCell);

                PdfPCell descriptionCell = new PdfPCell(new Phrase(desc, smallFont));
                if (isWeekend)
                    descriptionCell.setBackgroundColor(new BaseColor(245, 245, 245));
                table.addCell(descriptionCell);
            }
        }

        document.add(table);
    }

    /**
     * Add headers to the timesheet table
     */
    private void addTimesheetTableHeaders(PdfPTable table, String viewMode, Font headerFont) {
        // Common headers
        PdfPCell dateHeader = new PdfPCell(new Phrase("Date", headerFont));
        dateHeader.setBackgroundColor(BaseColor.LIGHT_GRAY);
        dateHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(dateHeader);

        if ("Weekly".equals(viewMode)) {
            PdfPCell dayHeader = new PdfPCell(new Phrase("Day", headerFont));
            dayHeader.setBackgroundColor(BaseColor.LIGHT_GRAY);
            dayHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(dayHeader);
        }

        PdfPCell taskTypeHeader = new PdfPCell(new Phrase("Task Type", headerFont));
        taskTypeHeader.setBackgroundColor(BaseColor.LIGHT_GRAY);
        taskTypeHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(taskTypeHeader);

        PdfPCell taskTopicHeader = new PdfPCell(new Phrase("Task Topic", headerFont));
        taskTopicHeader.setBackgroundColor(BaseColor.LIGHT_GRAY);
        taskTopicHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(taskTopicHeader);

        PdfPCell hoursHeader = new PdfPCell(new Phrase("Hours", headerFont));
        hoursHeader.setBackgroundColor(BaseColor.LIGHT_GRAY);
        hoursHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(hoursHeader);

        PdfPCell projectHeader = new PdfPCell(new Phrase("Project", headerFont));
        projectHeader.setBackgroundColor(BaseColor.LIGHT_GRAY);
        projectHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(projectHeader);

        PdfPCell descriptionHeader = new PdfPCell(new Phrase("Description", headerFont));
        descriptionHeader.setBackgroundColor(BaseColor.LIGHT_GRAY);
        descriptionHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(descriptionHeader);
    }

    private String formatIsoStringWithSuffix(String isoString) {
        // Parse the ISO-8601 string
        OffsetDateTime odt = OffsetDateTime.parse(isoString, DateTimeFormatter.ISO_OFFSET_DATE_TIME);

        // Convert to LocalDate (in system default timezone if needed)
        LocalDate date = odt.atZoneSameInstant(ZoneId.systemDefault()).toLocalDate();

        // Get day and suffix
        int day = date.getDayOfMonth();
        String daySuffix;
        if (day >= 11 && day <= 13) {
            daySuffix = "th";
        } else {
            switch (day % 10) {
                case 1:
                    daySuffix = "st";
                    break;
                case 2:
                    daySuffix = "nd";
                    break;
                case 3:
                    daySuffix = "rd";
                    break;
                default:
                    daySuffix = "th";
                    break;
            }
        }

        // Format month and year
        DateTimeFormatter monthYearFormatter = DateTimeFormatter.ofPattern("MMMM yyyy");
        return day + daySuffix + " " + date.format(monthYearFormatter);
    }

    /**
     * Add a row to the timesheet table
     */
    private void addTimesheetTableRow(PdfPTable table, InvoiceRequestDTO.TimesheetEntryDTO entry,
            String viewMode, Font normalFont, Font smallFont) {

        // Date cell
        PdfPCell dateCell = new PdfPCell(new Phrase(formatIsoStringWithSuffix(entry.getDate()), normalFont));
        if (entry.getIsWeekend() != null && entry.getIsWeekend()) {
            dateCell.setBackgroundColor(new BaseColor(245, 245, 245)); // Light gray for weekends
        }
        table.addCell(dateCell);

        // Day cell (only for weekly view)
        if ("Weekly".equals(viewMode)) {
            PdfPCell dayCell = new PdfPCell(new Phrase(entry.getDayOfWeek(), smallFont));
            if (entry.getIsWeekend() != null && entry.getIsWeekend()) {
                dayCell.setBackgroundColor(new BaseColor(245, 245, 245));
            }
            table.addCell(dayCell);
        }

        // Task Type cell
        PdfPCell taskTypeCell = new PdfPCell(
                new Phrase(entry.getTaskType() != null ? entry.getTaskType() : "", normalFont));
        if (entry.getIsWeekend() != null && entry.getIsWeekend()) {
            taskTypeCell.setBackgroundColor(new BaseColor(245, 245, 245));
        }
        table.addCell(taskTypeCell);

        // Task Topic cell
        PdfPCell taskTopicCell = new PdfPCell(
                new Phrase(entry.getTaskTopic() != null ? entry.getTaskTopic() : "", smallFont));
        if (entry.getIsWeekend() != null && entry.getIsWeekend()) {
            taskTopicCell.setBackgroundColor(new BaseColor(245, 245, 245));
        }
        table.addCell(taskTopicCell);

        // Hours cell
        String hoursText = (entry.getHours() != null ? entry.getHours() : 0) + "h "
                + (entry.getMinutes() != null ? entry.getMinutes() : 0) + "m";
        PdfPCell hoursCell = new PdfPCell(new Phrase(hoursText, normalFont));
        hoursCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        if (entry.getIsWeekend() != null && entry.getIsWeekend()) {
            hoursCell.setBackgroundColor(new BaseColor(245, 245, 245));
        }
        table.addCell(hoursCell);

        // Project cell
        PdfPCell projectCell = new PdfPCell(
                new Phrase(entry.getProject() != null ? entry.getProject() : "", smallFont));
        if (entry.getIsWeekend() != null && entry.getIsWeekend()) {
            projectCell.setBackgroundColor(new BaseColor(245, 245, 245));
        }
        table.addCell(projectCell);

        // Description cell
        PdfPCell descriptionCell = new PdfPCell(
                new Phrase(entry.getDescription() != null ? entry.getDescription() : "", smallFont));
        if (entry.getIsWeekend() != null && entry.getIsWeekend()) {
            descriptionCell.setBackgroundColor(new BaseColor(245, 245, 245));
        }
        table.addCell(descriptionCell);
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
        dto.setProjectName(invoice.getProjectName());
        dto.setPdfFileName(invoice.getPdfFileName());
        dto.setCreatedAt(invoice.getCreatedAt() != null ? invoice.getCreatedAt().toLocalDate() : null);

        // Add attachment info
        dto.setAttachmentCount(invoice.getAttachmentCount());
        dto.setAttachmentFileNames(invoice.getAttachmentFileNames());

        return dto;
    }

    public boolean invoiceExists(String invoiceId) {
        try {
            return invoiceRepository.existsByInvoiceId(invoiceId);
        } catch (Exception e) {
            log.error("Error checking if invoice exists: {}", invoiceId, e);
            return false;
        }
    }

    /**
     * Check if an invoice is soft deleted
     */
    public boolean isInvoiceDeleted(String invoiceId) {
        try {
            Optional<Invoice> invoice = invoiceRepository.findByInvoiceId(invoiceId);
            return invoice.map(Invoice::isDeleted).orElse(false);
        } catch (Exception e) {
            log.error("Error checking if invoice is deleted: {}", invoiceId, e);
            return false;
        }
    }

    /**
     * Soft delete an invoice by setting deleted flag and timestamp
     */
    @Transactional
    public boolean softDeleteInvoice(String invoiceId) {
        try {
            Optional<Invoice> invoiceOptional = invoiceRepository.findByInvoiceId(invoiceId);

            if (invoiceOptional.isEmpty()) {
                log.warn("Invoice not found for soft delete: {}", invoiceId);
                return false;
            }

            Invoice invoice = invoiceOptional.get();

            // Check if already deleted
            if (invoice.isDeleted()) {
                log.warn("Invoice already soft deleted: {}", invoiceId);
                return false;
            }

            // Perform soft delete
            invoice.setDeleted(true);
            invoice.setDeletedAt(LocalDateTime.now());
            // Optional: Set who deleted it if you have user context
            // invoice.setDeletedBy(getCurrentUserId());

            invoiceRepository.save(invoice);

            log.info("Invoice soft deleted successfully: {}", invoiceId);
            return true;

        } catch (Exception e) {
            log.error("Error during soft delete of invoice: {}", invoiceId, e);
            throw new RuntimeException("Failed to soft delete invoice", e);
        }
    }

    /**
     * Update getAllInvoices to exclude soft-deleted invoices by default
     */
    public List<InvoiceResponseDTO> getAllInvoices() {
        try {
            List<Invoice> invoices = invoiceRepository.findByDeletedFalseOrderByCreatedAtDesc();
            return invoices.stream()
                    .map(this::convertToResponseDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error retrieving all invoices", e);
            return new ArrayList<>();
        }
    }

    /**
     * Get all invoices including soft-deleted ones (for admin use)
     */
    public List<InvoiceResponseDTO> getAllInvoicesIncludingDeleted() {
        try {
            List<Invoice> invoices = invoiceRepository.findAllByOrderByCreatedAtDesc();
            return invoices.stream()
                    .map(this::convertToResponseDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error retrieving all invoices including deleted", e);
            return new ArrayList<>();
        }
    }

    /**
     * Get only soft-deleted invoices (for admin reporting purposes)
     */
    public List<InvoiceResponseDTO> getDeletedInvoices() {
        try {
            List<Invoice> invoices = invoiceRepository.findByDeletedTrueOrderByDeletedAtDesc();
            return invoices.stream()
                    .map(this::convertToResponseDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error retrieving deleted invoices", e);
            return new ArrayList<>();
        }
    }

    /**
     * Get projects for invoice dropdown
     */
    public List<Map<String, Object>> getProjectsForInvoice() {
        try {
            List<Project> projects = projectRepository.findByEndTimestampIsNull();
            return projects.stream()
                    .map(project -> {
                        Map<String, Object> projectMap = new HashMap<>();
                        projectMap.put("projectId", project.getProjectId());
                        projectMap.put("projectCode", project.getProjectCode());
                        projectMap.put("projectName", project.getProjectName());
                        return projectMap;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error retrieving projects for invoice: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
}
