package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTO.InvoiceEmployeeDTO;
import com.Protronserver.Protronserver.DTO.InvoiceItemDTO;
import com.Protronserver.Protronserver.DTOs.InvoiceRequestDTO;
import com.Protronserver.Protronserver.DTOs.InvoiceTaxDTO;
import com.Protronserver.Protronserver.Entities.*;
import com.Protronserver.Protronserver.Repository.InvoiceRepository;
import com.Protronserver.Protronserver.DTOs.InvoiceResponseDTO;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.itextpdf.text.pdf.draw.LineSeparator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
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
import com.Protronserver.Protronserver.Repository.ProjectRepository;
import com.Protronserver.Protronserver.Repository.TenantRepository;
import java.util.HashMap;

@Service
public class InvoiceService {

    private static final Logger log = LoggerFactory.getLogger(InvoiceService.class);

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    @Autowired
    private TenantRepository tenantRepository;

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

            Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();

            BigDecimal totalAmount = requestDTO.getTotalAmount();
            if (totalAmount == null) {
                totalAmount = requestDTO.getRate()
                        .multiply(BigDecimal.valueOf(requestDTO.getHoursSpent()));
            }

            Invoice invoice = new Invoice();

            String customInvoiceId = generateInvoiceId();
            invoice.setInvoiceId(customInvoiceId);
            invoice.setTenantId(tenantId);
            invoice.setInvoiceName(requestDTO.getInvoiceName());
            invoice.setInvoiceType(requestDTO.getInvoiceType());
            invoice.setCustomerInfo(requestDTO.getCustomerInfo());
            invoice.setSupplierInfo(requestDTO.getSupplierInfo());
            invoice.setCustomerName(requestDTO.getCustomerName());
            invoice.setBillToAddress(requestDTO.getBillToAddress());
            invoice.setShipToAddress(requestDTO.getShipToAddress());
            invoice.setCustomerAddress(requestDTO.getBillToAddress());
            invoice.setSupplierName(requestDTO.getSupplierName());
            invoice.setSupplierAddress(requestDTO.getSupplierAddress());
            invoice.setRate(requestDTO.getRate());
            invoice.setCurrency(requestDTO.getCurrency());
            invoice.setFromDate(requestDTO.getFromDate());
            invoice.setToDate(requestDTO.getToDate());
            invoice.setHoursSpent(requestDTO.getHoursSpent());
            invoice.setTotalAmount(totalAmount);
            invoice.setRemarks(requestDTO.getRemarks());
            invoice.setProjectName(requestDTO.getProjectName());
            invoice.setCreatedAt(LocalDateTime.now());
            invoice.setCountry(requestDTO.getCountry());
            invoice.setDiscountPercent(requestDTO.getDiscountPercent());
            invoice.setDueDate(requestDTO.getDueDate());

            // =========================
            // MAP TAXES
            // =========================
            if (requestDTO.getTaxes() != null && !requestDTO.getTaxes().isEmpty()) {
                List<InvoiceTax> taxEntities = new ArrayList<>();

                for (InvoiceTaxDTO taxDTO : requestDTO.getTaxes()) {
                    InvoiceTax tax = new InvoiceTax();
                    tax.setInvoice(invoice); // IMPORTANT
                    tax.setTaxName(taxDTO.getTaxName());
                    tax.setTaxPercentage(taxDTO.getTaxPercentage());
                    tax.setTaxNumber(taxDTO.getTaxNumber());

                    taxEntities.add(tax);
                }

                invoice.setInvoiceTaxes(taxEntities);
            }
            // =========================
            // MAP ITEMS
            // =========================
            if (requestDTO.getItems() != null && !requestDTO.getItems().isEmpty()) {
                List<InvoiceItem> itemEntities = new ArrayList<>();

                for (InvoiceItemDTO itemDTO : requestDTO.getItems()) {
                    InvoiceItem item = new InvoiceItem();
                    item.setInvoice(invoice); // IMPORTANT
                    item.setItemDesc(itemDTO.getItemDesc());
                    item.setRate(itemDTO.getRate());
                    item.setQuantity(itemDTO.getQuantity());
                    item.setAmount(itemDTO.getAmount());
                    item.setRemarks(itemDTO.getRemarks());
                    item.setUpdatedTs(LocalDateTime.now());
                    item.setUpdatedBy(loggedInUserUtils.getLoggedInUser().getEmail());

                    itemEntities.add(item);
                }

                invoice.setInvoiceItems(itemEntities);
            }

            // =========================
            // MAP EMPLOYEES
            // =========================
            if (requestDTO.getEmployees() != null && !requestDTO.getEmployees().isEmpty()) {
                List<InvoiceEmployee> employeeEntities = new ArrayList<>();

                for (InvoiceEmployeeDTO empDTO : requestDTO.getEmployees()) {
                    InvoiceEmployee emp = new InvoiceEmployee();
                    emp.setInvoice(invoice); // IMPORTANT
                    emp.setItemDesc(empDTO.getItemDesc());
                    emp.setRate(empDTO.getRate());
                    emp.setQuantity(empDTO.getQuantity());
                    emp.setAmount(empDTO.getAmount());
                    emp.setRemarks(empDTO.getRemarks());
                    emp.setUpdatedTs(LocalDateTime.now());
                    emp.setUpdatedBy(loggedInUserUtils.getLoggedInUser().getEmail());

                    employeeEntities.add(emp);
                }

                invoice.setInvoiceEmployees(employeeEntities);
            }

            // =========================
            // PDF
            // =========================
            byte[] pdfBytes = generateInvoicePDF(invoice, requestDTO.getTimesheetData());
            invoice.setPdfData(pdfBytes);
            invoice.setPdfFileName(customInvoiceId + ".pdf");

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

            Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();

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
            invoice.setTenantId(tenantId);
            invoice.setInvoiceName(requestDTO.getInvoiceName());
            invoice.setInvoiceType(requestDTO.getInvoiceType());
            invoice.setCustomerName(requestDTO.getCustomerName());
            invoice.setCustomerInfo(requestDTO.getCustomerInfo());
            invoice.setSupplierInfo(requestDTO.getSupplierInfo());
            invoice.setCountry(requestDTO.getCountry());
            // Map new billTo/shipTo fields; populate customerAddress for backward
            // compatibility
            invoice.setBillToAddress(requestDTO.getBillToAddress());
            invoice.setShipToAddress(requestDTO.getShipToAddress());
            invoice.setCustomerAddress(requestDTO.getBillToAddress());
            invoice.setSupplierName(requestDTO.getSupplierName());
            invoice.setSupplierAddress(requestDTO.getSupplierAddress());
            // =========================
            // MAP ITEMS
            // =========================
            if (requestDTO.getItems() != null && !requestDTO.getItems().isEmpty()) {
                List<InvoiceItem> itemEntities = new ArrayList<>();

                for (InvoiceItemDTO itemDTO : requestDTO.getItems()) {
                    InvoiceItem item = new InvoiceItem();
                    item.setInvoice(invoice); // IMPORTANT
                    item.setItemDesc(itemDTO.getItemDesc());
                    item.setRate(itemDTO.getRate());
                    item.setQuantity(itemDTO.getQuantity());
                    item.setAmount(itemDTO.getAmount());
                    item.setRemarks(itemDTO.getRemarks());
                    item.setUpdatedTs(LocalDateTime.now());
                    item.setUpdatedBy(loggedInUserUtils.getLoggedInUser().getEmail());

                    itemEntities.add(item);
                }

                invoice.setInvoiceItems(itemEntities);
            }

            // =========================
            // MAP EMPLOYEES
            // =========================
            if (requestDTO.getEmployees() != null && !requestDTO.getEmployees().isEmpty()) {
                List<InvoiceEmployee> employeeEntities = new ArrayList<>();

                for (InvoiceEmployeeDTO empDTO : requestDTO.getEmployees()) {
                    InvoiceEmployee emp = new InvoiceEmployee();
                    emp.setInvoice(invoice); // IMPORTANT
                    emp.setItemDesc(empDTO.getItemDesc());
                    emp.setRate(empDTO.getRate());
                    emp.setQuantity(empDTO.getQuantity());
                    emp.setAmount(empDTO.getAmount());
                    emp.setRemarks(empDTO.getRemarks());
                    emp.setUpdatedTs(LocalDateTime.now());
                    emp.setUpdatedBy(loggedInUserUtils.getLoggedInUser().getEmail());

                    employeeEntities.add(emp);
                }

                invoice.setInvoiceEmployees(employeeEntities);
            }
            invoice.setRate(requestDTO.getRate());
            invoice.setCurrency(requestDTO.getCurrency());
            invoice.setFromDate(requestDTO.getFromDate());
            invoice.setToDate(requestDTO.getToDate());
            invoice.setHoursSpent(requestDTO.getHoursSpent());
            invoice.setTotalAmount(totalAmount);
            invoice.setRemarks(requestDTO.getRemarks());
            invoice.setProjectName(requestDTO.getProjectName());
            invoice.setCreatedAt(LocalDateTime.now());

            // =========================
            // MAP TAXES
            // =========================
            if (requestDTO.getTaxes() != null && !requestDTO.getTaxes().isEmpty()) {
                List<InvoiceTax> taxEntities = new ArrayList<>();

                for (InvoiceTaxDTO taxDTO : requestDTO.getTaxes()) {
                    InvoiceTax tax = new InvoiceTax();
                    tax.setInvoice(invoice); // IMPORTANT
                    tax.setTaxName(taxDTO.getTaxName());
                    tax.setTaxPercentage(taxDTO.getTaxPercentage());
                    tax.setTaxNumber(taxDTO.getTaxNumber());

                    taxEntities.add(tax);
                }

                invoice.setInvoiceTaxes(taxEntities);
            }

            invoice.setDiscountPercent(requestDTO.getDiscountPercent());
            invoice.setDueDate(requestDTO.getDueDate());

            // Process attachments (up to 4)
            if (attachments != null && !attachments.isEmpty()) {
                processAttachments(invoice, attachments);
            }

            // Generate PDF
            InvoiceRequestDTO.TimesheetDataDTO timesheetToUse = null;
            if (requestDTO.getTimesheetData() != null
                    && (requestDTO.getEmployees() == null || requestDTO.getEmployees().size() <= 1)) {
                timesheetToUse = requestDTO.getTimesheetData();
            }
            byte[] pdfBytes = generateInvoicePDF(invoice, timesheetToUse);
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
        if (invoiceOpt.isPresent()) {
            try {
                Invoice invoice = invoiceOpt.get();
                // Generate PDF on-demand with corrected tax logic
                byte[] pdfBytes = generateInvoicePDF(invoice, null);
                return new ByteArrayResource(pdfBytes);
            } catch (Exception e) {
                log.error("Error generating PDF for invoice {}: {}", invoiceId, e.getMessage());
                // Fallback to stored PDF if available
                if (invoiceOpt.get().getPdfData() != null) {
                    return new ByteArrayResource(invoiceOpt.get().getPdfData());
                }
            }
        }
        throw new RuntimeException("Invoice not found: " + invoiceId);
    }

    public List<InvoiceResponseDTO> searchInvoicesByCustomer(String customerName) {
        Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
        return invoiceRepository.findByTenantIdAndCustomerNameContainingIgnoreCase(customerName, tenantId).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    private void addHeaderCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(8);
        cell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        table.addCell(cell);
    }

    private byte[] generateInvoicePDF(Invoice invoice, InvoiceRequestDTO.TimesheetDataDTO timesheetData)
            throws DocumentException, IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document();
        PdfWriter.getInstance(document, baos);

        document.open();

        // Define professional fonts and colors
        Font titleFont = new Font(Font.FontFamily.HELVETICA, 24, Font.BOLD, BaseColor.DARK_GRAY);
        Font headerFont = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, BaseColor.WHITE);
        Font normalFont = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, BaseColor.DARK_GRAY);
        Font smallFont = new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL, BaseColor.GRAY);
        Font accentFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, new BaseColor(41, 128, 185)); // Professional blue
        
        // Define professional colors
        BaseColor primaryColor = new BaseColor(41, 128, 185); // Professional blue
        BaseColor borderGray = new BaseColor(200, 200, 200); // Border gray
        BaseColor accentGreen = new BaseColor(39, 174, 96); // Success green

        // ---------------------- HEADER: Title + Logo ----------------------
        // Add a professional header with background
        PdfPTable headerTable = new PdfPTable(3);
        headerTable.setWidthPercentage(100);
        headerTable.setSpacingAfter(8);
        headerTable.setWidths(new float[] { 4f, 2f, 4f });

        // Empty left cell for spacing
        PdfPCell leftEmptyCell = new PdfPCell(new Phrase(""));
        leftEmptyCell.setBorder(Rectangle.NO_BORDER);
        headerTable.addCell(leftEmptyCell);

        // Invoice Title with professional styling - centered
        PdfPCell titleCell = new PdfPCell(new Phrase("INVOICE", titleFont));
        titleCell.setBorder(Rectangle.NO_BORDER);
        titleCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        titleCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        titleCell.setPadding(10);
        titleCell.setBackgroundColor(new BaseColor(248, 249, 250)); // Subtle background
        headerTable.addCell(titleCell);

        // Logo cell with better styling
        PdfPCell logocell;
        if (invoice.getSupplierName() != null) {
            Tenant tenant = loggedInUserUtils.getLoggedInUser().getTenant();
            if (tenant != null &&
                    tenant.getTenantName() != null &&
                    invoice.getSupplierName().equalsIgnoreCase(tenant.getTenantName()) &&
                    tenant.getTenantLogo() != null) {
                try {
                    Image logo = Image.getInstance(tenant.getTenantLogo());
                    logo.scaleToFit(120f, 60f);
                    logocell = new PdfPCell(logo);
                    logocell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                    logocell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                } catch (Exception e) {
                    log.warn("Failed to load tenant logo, using placeholder", e);
                    logocell = new PdfPCell(new Phrase("", titleFont));
                }
            } else {
                logocell = new PdfPCell(new Phrase("", titleFont));
            }
        } else {
            logocell = new PdfPCell(new Phrase("", titleFont));
        }
        logocell.setBorder(Rectangle.NO_BORDER);
        logocell.setPadding(10);
        headerTable.addCell(logocell);

        document.add(headerTable);

        // Add a professional separator line
        LineSeparator separator = new LineSeparator();
        separator.setLineColor(new BaseColor(200, 200, 200));
        separator.setLineWidth(1f);
        document.add(separator);
        document.add(new Paragraph(" ")); // Add some spacing

        // ---------------------- INVOICE META + SUPPLIER ----------------------
        PdfPTable metaTable = new PdfPTable(2);
        metaTable.setWidthPercentage(100);
        metaTable.setWidths(new float[] { 5f, 5f });
        metaTable.setSpacingAfter(10);

        // Left side: Invoice details with better styling
        PdfPCell leftMetaCell = new PdfPCell();
        leftMetaCell.setBorder(Rectangle.BOX);
        leftMetaCell.setBorderColor(borderGray);
        leftMetaCell.setPadding(10);
        leftMetaCell.setBackgroundColor(BaseColor.WHITE);
        
        Paragraph invoiceIdPara = new Paragraph("Invoice ID: ", normalFont);
        invoiceIdPara.add(new Chunk(invoice.getInvoiceId(), accentFont));
        leftMetaCell.addElement(invoiceIdPara);
        
        leftMetaCell.addElement(new Paragraph("Invoice Name: " + invoice.getInvoiceName(), normalFont));
        leftMetaCell.addElement(new Paragraph("Invoice Date: " + formatLocalDateTimeWithSuffix(invoice.getCreatedAt()), normalFont));
        leftMetaCell.addElement(new Paragraph("Bill Period: "
                + (invoice.getFromDate() != null ? invoice.getFromDate() : "")
                + " - "
                + (invoice.getToDate() != null ? invoice.getToDate() : ""), normalFont));
        metaTable.addCell(leftMetaCell);

        // Right side: Supplier Details with professional styling
        PdfPCell rightMetaCell = new PdfPCell();
        rightMetaCell.setBorder(Rectangle.BOX);
        rightMetaCell.setBorderColor(borderGray);
        rightMetaCell.setPadding(10);
        rightMetaCell.setBackgroundColor(BaseColor.WHITE);
        
        Paragraph supplierNamePara = new Paragraph("Supplier Name: ", normalFont);
        supplierNamePara.add(new Chunk(invoice.getSupplierName(), accentFont));
        rightMetaCell.addElement(supplierNamePara);
        
        rightMetaCell.addElement(new Paragraph(
                "Supplier Address: " + (invoice.getShipToAddress() != null ? invoice.getShipToAddress() : ""),
                normalFont));
        rightMetaCell.addElement(new Paragraph(
                "Supplier Info: " + (invoice.getSupplierInfo() != null ? invoice.getSupplierInfo() : ""), normalFont));
        metaTable.addCell(rightMetaCell);

        document.add(metaTable);

        // ---------------------- CUSTOMER DETAILS ----------------------
        // Use invoiceType to determine format, fallback to country for backward compatibility
        boolean isDomestic = "DOMESTIC".equalsIgnoreCase(invoice.getInvoiceType())
                || ("india".equalsIgnoreCase(invoice.getCountry()) && invoice.getInvoiceType() == null);

        // Customer section header
        Paragraph customerHeader = new Paragraph("BILL TO", new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD, primaryColor));
        customerHeader.setSpacingBefore(5);
        customerHeader.setSpacingAfter(5);
        document.add(customerHeader);

        PdfPTable customerTable;
        if (isDomestic) {
            customerTable = new PdfPTable(2);
            customerTable.setWidthPercentage(100);
            customerTable.setWidths(new float[] { 5f, 5f });
        } else {
            customerTable = new PdfPTable(1);
            customerTable.setWidthPercentage(100);
        }

        // Customer name with accent styling
        Paragraph customerNamePara = new Paragraph("Customer Name: ", normalFont);
        customerNamePara.add(new Chunk(invoice.getCustomerName(), accentFont));
        PdfPCell customerNameCell = new PdfPCell(customerNamePara);
        customerNameCell.setBorder(Rectangle.BOX);
        customerNameCell.setBorderColor(borderGray);
        customerNameCell.setPadding(8);
        customerNameCell.setBackgroundColor(BaseColor.WHITE);
        customerTable.addCell(customerNameCell);

        if (isDomestic) {
            PdfPCell emptyCell = new PdfPCell(new Phrase(""));
            emptyCell.setBorder(Rectangle.BOX);
            emptyCell.setBorderColor(borderGray);
            emptyCell.setPadding(8);
            emptyCell.setBackgroundColor(BaseColor.WHITE);
            customerTable.addCell(emptyCell);

            // Bill To address
            PdfPCell billToCell = new PdfPCell(new Phrase(
                    "Bill To: " + (invoice.getBillToAddress() != null ? invoice.getBillToAddress() : ""), normalFont));
            billToCell.setBorder(Rectangle.BOX);
            billToCell.setBorderColor(borderGray);
            billToCell.setPadding(8);
            billToCell.setBackgroundColor(BaseColor.WHITE);
            customerTable.addCell(billToCell);

            // Ship To address
            PdfPCell shipToCell = new PdfPCell(new Phrase(
                    "Ship To: " + (invoice.getShipToAddress() != null ? invoice.getShipToAddress() : ""), normalFont));
            shipToCell.setBorder(Rectangle.BOX);
            shipToCell.setBorderColor(borderGray);
            shipToCell.setPadding(8);
            shipToCell.setBackgroundColor(BaseColor.WHITE);
            customerTable.addCell(shipToCell);
        } else {
            PdfPCell addressCell = new PdfPCell(new Phrase(
                    "Customer Address: " + (invoice.getCustomerAddress() != null ? invoice.getCustomerAddress() : ""),
                    normalFont));
            addressCell.setBorder(Rectangle.BOX);
            addressCell.setBorderColor(borderGray);
            addressCell.setPadding(8);
            addressCell.setBackgroundColor(BaseColor.WHITE);
            customerTable.addCell(addressCell);
        }

        customerTable.setSpacingAfter(10);
        document.add(customerTable);

        /// ---------------------- ITEMS & EMPLOYEES TABLE ----------------------
        // Add section header
        Paragraph itemsHeader = new Paragraph("ITEM DETAILS", new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD, primaryColor));
        itemsHeader.setSpacingBefore(3);
        itemsHeader.setSpacingAfter(5);
        document.add(itemsHeader);

        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 0.4f, 4.5f, 1.2f, 1.2f, 1.6f, 3.5f });
        table.setSpacingBefore(3);

        // Enhanced header row with professional styling
        String amountHeader = "Amount (" + (invoice.getCurrency() != null ? invoice.getCurrency() : "") + ")";
        String[] headers = new String[] { "#", "Item Description", "Rate", "Qty", amountHeader, "Remarks" };
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
            cell.setBorder(Rectangle.BOX);
            cell.setBorderColor(borderGray);
            cell.setBackgroundColor(primaryColor);
            cell.setPadding(8);
            // Align numeric headers to right, others to left
            if (header.equals("Rate") || header.equals("Quantity") || header.equals(amountHeader)) {
                cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            } else {
                cell.setHorizontalAlignment(Element.ALIGN_LEFT);
            }
            table.addCell(cell);
        }

        // Add items and employees in same table with alternating row colors
        int rowCount = 0;
        int srNo = 1;

        // ----------- Invoice Items -----------
        if (invoice.getInvoiceItems() != null) {
            for (InvoiceItem item : invoice.getInvoiceItems()) {
                boolean isEvenRow = (rowCount % 2 == 0);
                BaseColor rowColor = isEvenRow ? BaseColor.WHITE : new BaseColor(249, 249, 249);
                
                // Sr. No
                PdfPCell srNoCell = new PdfPCell(new Phrase(String.valueOf(srNo), normalFont));
                srNoCell.setBorder(Rectangle.BOX);
                srNoCell.setBorderColor(borderGray);
                srNoCell.setBackgroundColor(rowColor);
                srNoCell.setPadding(6);
                srNoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(srNoCell);
                
                // Description
                PdfPCell itemDescCell = new PdfPCell(new Phrase(item.getItemDesc() != null ? item.getItemDesc() : "", normalFont));
                itemDescCell.setBorder(Rectangle.BOX);
                itemDescCell.setBorderColor(borderGray);
                itemDescCell.setBackgroundColor(rowColor);
                itemDescCell.setPadding(6);
                itemDescCell.setHorizontalAlignment(Element.ALIGN_LEFT);
                itemDescCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                table.addCell(itemDescCell);
                
                // Rate
                PdfPCell rateCell = new PdfPCell(new Phrase(String.valueOf(item.getRate()), normalFont));
                rateCell.setBorder(Rectangle.BOX);
                rateCell.setBorderColor(borderGray);
                rateCell.setBackgroundColor(rowColor);
                rateCell.setPadding(6);
                rateCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                table.addCell(rateCell);
                
                // Quantity
                PdfPCell qtyCell = new PdfPCell(new Phrase(String.valueOf(item.getQuantity()), normalFont));
                qtyCell.setBorder(Rectangle.BOX);
                qtyCell.setBorderColor(borderGray);
                qtyCell.setBackgroundColor(rowColor);
                qtyCell.setPadding(6);
                qtyCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                table.addCell(qtyCell);
                
                // Amount
                PdfPCell amountCell = new PdfPCell(new Phrase(String.valueOf(item.getAmount()), normalFont));
                amountCell.setBorder(Rectangle.BOX);
                amountCell.setBorderColor(borderGray);
                amountCell.setBackgroundColor(rowColor);
                amountCell.setPadding(6);
                amountCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                table.addCell(amountCell);
                
                // Remarks
                PdfPCell remarksCell = new PdfPCell(new Phrase(item.getRemarks() != null ? item.getRemarks() : "", normalFont));
                remarksCell.setBorder(Rectangle.BOX);
                remarksCell.setBorderColor(borderGray);
                remarksCell.setBackgroundColor(rowColor);
                remarksCell.setPadding(6);
                remarksCell.setHorizontalAlignment(Element.ALIGN_LEFT);
                remarksCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                table.addCell(remarksCell);
                
                srNo++;
                rowCount++;
            }
        }

        // ----------- Invoice Employees -----------
        if (invoice.getInvoiceEmployees() != null) {
            for (InvoiceEmployee emp : invoice.getInvoiceEmployees()) {
                boolean isEvenRow = (rowCount % 2 == 0);
                BaseColor rowColor = isEvenRow ? BaseColor.WHITE : new BaseColor(249, 249, 249);
                
                // Sr. No
                PdfPCell srNoCell = new PdfPCell(new Phrase(String.valueOf(srNo), normalFont));
                srNoCell.setBorder(Rectangle.BOX);
                srNoCell.setBorderColor(borderGray);
                srNoCell.setBackgroundColor(rowColor);
                srNoCell.setPadding(6);
                srNoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(srNoCell);
                
                // Description
                PdfPCell empDescCell = new PdfPCell(new Phrase(emp.getItemDesc() != null ? emp.getItemDesc() : "", normalFont));
                empDescCell.setBorder(Rectangle.BOX);
                empDescCell.setBorderColor(borderGray);
                empDescCell.setBackgroundColor(rowColor);
                empDescCell.setPadding(6);
                empDescCell.setHorizontalAlignment(Element.ALIGN_LEFT);
                empDescCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                table.addCell(empDescCell);
                
                // Rate
                PdfPCell empRateCell = new PdfPCell(new Phrase(String.valueOf(emp.getRate()), normalFont));
                empRateCell.setBorder(Rectangle.BOX);
                empRateCell.setBorderColor(borderGray);
                empRateCell.setBackgroundColor(rowColor);
                empRateCell.setPadding(6);
                empRateCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                table.addCell(empRateCell);
                
                // Quantity
                PdfPCell empQtyCell = new PdfPCell(new Phrase(String.valueOf(emp.getQuantity()), normalFont));
                empQtyCell.setBorder(Rectangle.BOX);
                empQtyCell.setBorderColor(borderGray);
                empQtyCell.setBackgroundColor(rowColor);
                empQtyCell.setPadding(6);
                empQtyCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                table.addCell(empQtyCell);
                
                // Amount
                PdfPCell empAmountCell = new PdfPCell(new Phrase(String.valueOf(emp.getAmount()), normalFont));
                empAmountCell.setBorder(Rectangle.BOX);
                empAmountCell.setBorderColor(borderGray);
                empAmountCell.setBackgroundColor(rowColor);
                empAmountCell.setPadding(6);
                empAmountCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                table.addCell(empAmountCell);
                
                // Remarks
                PdfPCell empRemarksCell = new PdfPCell(new Phrase(emp.getRemarks() != null ? emp.getRemarks() : "", normalFont));
                empRemarksCell.setBorder(Rectangle.BOX);
                empRemarksCell.setBorderColor(borderGray);
                empRemarksCell.setBackgroundColor(rowColor);
                empRemarksCell.setPadding(6);
                empRemarksCell.setHorizontalAlignment(Element.ALIGN_LEFT);
                empRemarksCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                table.addCell(empRemarksCell);
                
                srNo++;
                rowCount++;
            }
        }

        // ----------- Add empty rows to fill page -----------
        // int minRows = 20; // Adjust this as needed for page size
        // for (int i = rowCount; i < minRows; i++) {
        //     for (int j = 0; j < 6; j++) {
        //         table.addCell(createBodyCell(" ", normalFont));
        //     }
        // }

//        // ----------- Grand Total Row -----------
//        PdfPCell totalLabel = new PdfPCell(new Phrase("Grand Total", headerFont));
//        totalLabel.setColspan(4);
//        totalLabel.setHorizontalAlignment(Element.ALIGN_RIGHT);
//        totalLabel.setBackgroundColor(BaseColor.LIGHT_GRAY);
//        totalLabel.setBorder(Rectangle.TOP | Rectangle.BOTTOM);
//        totalLabel.setPadding(8);
//
//        PdfPCell totalValue = new PdfPCell(
//                new Phrase(invoice.getCurrency() + " " + invoice.getTotalAmount(), headerFont));
//        totalValue.setColspan(1);
//        totalValue.setHorizontalAlignment(Element.ALIGN_LEFT);
//        totalValue.setBackgroundColor(BaseColor.LIGHT_GRAY);
//        totalValue.setBorder(Rectangle.TOP | Rectangle.BOTTOM);
//        totalValue.setPadding(8);
//
//        table.addCell(totalLabel);
//        table.addCell(totalValue);

        document.add(table);

        // ---------------------- TAXES AND DISCOUNT CALCULATIONS ----------------------
        BigDecimal subtotal = invoice.getTotalAmount() != null ? invoice.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal totalTaxAmount = BigDecimal.ZERO;
        BigDecimal grandTotal = subtotal;

        // Calculate discount amount if discount percent is present
        if (invoice.getDiscountPercent() != null && invoice.getDiscountPercent().compareTo(BigDecimal.ZERO) > 0) {
            discountAmount = subtotal.multiply(invoice.getDiscountPercent()).divide(new BigDecimal("100"), RoundingMode.HALF_UP);
            grandTotal = subtotal.subtract(discountAmount);
        }

        // Calculate total tax amount
        if (invoice.getInvoiceTaxes() != null && !invoice.getInvoiceTaxes().isEmpty()) {
            for (InvoiceTax tax : invoice.getInvoiceTaxes()) {
                if (tax.getTaxPercentage() != null) {
                    // Calculate tax on discounted amount (grandTotal - totalTaxAmount)
                    BigDecimal taxAmount = grandTotal.subtract(totalTaxAmount).multiply(tax.getTaxPercentage()).divide(new BigDecimal("100"), RoundingMode.HALF_UP);
                    totalTaxAmount = totalTaxAmount.add(taxAmount);
                }
            }
            grandTotal = grandTotal.add(totalTaxAmount);
        }

        // ---------------------- SUMMARY SECTION ----------------------
        // Create a right-aligned summary table with 2 columns
        PdfPTable summaryWrapper = new PdfPTable(1);
        summaryWrapper.setWidthPercentage(40);
        summaryWrapper.setHorizontalAlignment(Element.ALIGN_RIGHT);
        summaryWrapper.setSpacingBefore(5);
        summaryWrapper.setSpacingAfter(5);
        
        // SUMMARY header cell
        PdfPCell summaryTitleCell = new PdfPCell(new Phrase("SUMMARY", new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, primaryColor)));
        summaryTitleCell.setBorder(Rectangle.NO_BORDER);
        summaryTitleCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        summaryTitleCell.setPaddingBottom(8);
        summaryWrapper.addCell(summaryTitleCell);
        
        // Create the summary content table (2 columns: label and value)
        PdfPTable summaryContent = new PdfPTable(2);
        summaryContent.setWidthPercentage(100);
        summaryContent.setWidths(new float[] { 2f, 1f });
        
        Font summaryLabelFont = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, BaseColor.DARK_GRAY);
        Font summaryValueFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BaseColor.DARK_GRAY);
        Font grandTotalFont = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, BaseColor.WHITE);
        
        // Subtotal row
        PdfPCell subtotalLabelCell = new PdfPCell(new Phrase("Subtotal -", summaryLabelFont));
        subtotalLabelCell.setBorder(Rectangle.NO_BORDER);
        subtotalLabelCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        subtotalLabelCell.setPadding(3);
        summaryContent.addCell(subtotalLabelCell);
        
        PdfPCell subtotalValueCell = new PdfPCell(new Phrase(String.valueOf(subtotal), summaryValueFont));
        subtotalValueCell.setBorder(Rectangle.NO_BORDER);
        subtotalValueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        subtotalValueCell.setPadding(3);
        summaryContent.addCell(subtotalValueCell);
        
        // Discount row if applicable
        if (discountAmount.compareTo(BigDecimal.ZERO) > 0) {
            PdfPCell discountLabelCell = new PdfPCell(new Phrase("Discount (" + invoice.getDiscountPercent() + "%) -", summaryLabelFont));
            discountLabelCell.setBorder(Rectangle.NO_BORDER);
            discountLabelCell.setHorizontalAlignment(Element.ALIGN_LEFT);
            discountLabelCell.setPadding(3);
            summaryContent.addCell(discountLabelCell);
            
            PdfPCell discountValueCell = new PdfPCell(new Phrase("(" + String.valueOf(discountAmount) + ")", new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, accentGreen)));
            discountValueCell.setBorder(Rectangle.NO_BORDER);
            discountValueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            discountValueCell.setPadding(3);
            summaryContent.addCell(discountValueCell);
        }
        
        // Tax rows
        if (invoice.getInvoiceTaxes() != null && !invoice.getInvoiceTaxes().isEmpty()) {
            for (InvoiceTax tax : invoice.getInvoiceTaxes()) {
                if (tax.getTaxPercentage() != null && tax.getTaxPercentage().compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal taxAmount = grandTotal.subtract(totalTaxAmount).multiply(tax.getTaxPercentage()).divide(new BigDecimal("100"), RoundingMode.HALF_UP);
                    String taxLabel = "Tax " + (tax.getTaxName() != null ? tax.getTaxName() : "") + " (" + tax.getTaxPercentage() + "%) -";
                    
                    PdfPCell taxLabelCell = new PdfPCell(new Phrase(taxLabel, summaryLabelFont));
                    taxLabelCell.setBorder(Rectangle.NO_BORDER);
                    taxLabelCell.setHorizontalAlignment(Element.ALIGN_LEFT);
                    taxLabelCell.setPadding(3);
                    summaryContent.addCell(taxLabelCell);
                    
                    PdfPCell taxValueCell = new PdfPCell(new Phrase(String.valueOf(taxAmount), summaryValueFont));
                    taxValueCell.setBorder(Rectangle.NO_BORDER);
                    taxValueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                    taxValueCell.setPadding(3);
                    summaryContent.addCell(taxValueCell);
                }
            }
        }
        
        // Grand Total row with background
        PdfPCell grandTotalLabelCell = new PdfPCell(new Phrase("Grand Total -", grandTotalFont));
        grandTotalLabelCell.setBorder(Rectangle.BOX);
        grandTotalLabelCell.setBorderColor(borderGray);
        grandTotalLabelCell.setBackgroundColor(primaryColor);
        grandTotalLabelCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        grandTotalLabelCell.setPadding(6);
        summaryContent.addCell(grandTotalLabelCell);
        
        PdfPCell grandTotalValueCell = new PdfPCell(new Phrase(String.valueOf(grandTotal), grandTotalFont));
        grandTotalValueCell.setBorder(Rectangle.BOX);
        grandTotalValueCell.setBorderColor(borderGray);
        grandTotalValueCell.setBackgroundColor(primaryColor);
        grandTotalValueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        grandTotalValueCell.setPadding(6);
        summaryContent.addCell(grandTotalValueCell);
        
        // Add summary content to wrapper
        PdfPCell contentCell = new PdfPCell(summaryContent);
        contentCell.setBorder(Rectangle.NO_BORDER);
        summaryWrapper.addCell(contentCell);
        
        document.add(summaryWrapper);

        // Amount in words
        try {
            if (grandTotal != null) {
                String amountWords = convertAmountToWords(grandTotal, invoice.getCurrency());
                Paragraph amountWordsPara = new Paragraph("Amount (in words): " + amountWords, smallFont);
                amountWordsPara.setSpacingBefore(5);
                document.add(amountWordsPara);
                log.info("Added amount-in-words to PDF for invoice {}: {}", invoice.getInvoiceId(), amountWords);
            }
        } catch (Exception e) {
            log.warn("Failed to convert amount to words for invoice {}: {}", invoice.getInvoiceId(), e.getMessage());
        }

        // Invoice remarks with enhanced styling
        if (invoice.getRemarks() != null && !invoice.getRemarks().trim().isEmpty()) {
            Paragraph remarksHeader = new Paragraph("REMARKS", new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, primaryColor));
            remarksHeader.setSpacingBefore(8);
            remarksHeader.setSpacingAfter(3);
            document.add(remarksHeader);
            
            Paragraph remarksPara = new Paragraph(invoice.getRemarks(), normalFont);
            remarksPara.setSpacingBefore(3);
            remarksPara.setSpacingAfter(8);
            document.add(remarksPara);
            log.info("Added remarks to PDF for invoice {}: {}", invoice.getInvoiceId(), invoice.getRemarks());
        }

        // Add professional signature section
        PdfPTable signatureTable = new PdfPTable(3);
        signatureTable.setWidthPercentage(100);
        signatureTable.setWidths(new float[] { 3f, 2f, 3f });
        signatureTable.setSpacingBefore(15);

        // Left empty cell for spacing
        PdfPCell leftSignatureEmpty = new PdfPCell();
        leftSignatureEmpty.setBorder(Rectangle.NO_BORDER);
        signatureTable.addCell(leftSignatureEmpty);

        // Center: Authorized Signature
        PdfPCell signatureCell = new PdfPCell();
        signatureCell.setBorder(Rectangle.TOP);
        signatureCell.setBorderColor(borderGray);
        signatureCell.setPadding(10);
        
        Paragraph signatureLabel = new Paragraph("Authorized Signature", smallFont);
        signatureLabel.setAlignment(Element.ALIGN_CENTER);
        signatureCell.addElement(signatureLabel);
        
        signatureTable.addCell(signatureCell);

        // Right empty cell for spacing
        PdfPCell rightSignatureEmpty = new PdfPCell();
        rightSignatureEmpty.setBorder(Rectangle.NO_BORDER);
        signatureTable.addCell(rightSignatureEmpty);
        
        document.add(signatureTable);

        // Add a separator before footer
        document.add(new Paragraph(" ")); // Add spacing
        LineSeparator footerSeparator = new LineSeparator();
        footerSeparator.setLineColor(borderGray);
        footerSeparator.setLineWidth(1f);
        document.add(footerSeparator);

        // Timesheet section
        if (timesheetData != null && timesheetData.getEntries() != null && !timesheetData.getEntries().isEmpty()) {
            document.newPage();
            addTimesheetSection(document, timesheetData, headerFont, normalFont, smallFont);
        }

        // Footer
        addContactFooter(document, invoice.getTenantId(), smallFont);

        document.close();
        return baos.toByteArray();
    }

    private PdfPCell createBodyCell(String text, Font font, int maxLen, int horizontalAlignment) {
        String t = text == null ? "" : text;
        if (maxLen > 0 && t.length() > maxLen) {
            t = t.substring(0, maxLen - 1) + "…"; // truncate with ellipsis
        }
        PdfPCell cell = new PdfPCell(new Phrase(t, font));
        cell.setPadding(5);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setHorizontalAlignment(horizontalAlignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setNoWrap(true); // avoid wrapping to visually limit characters
        return cell;
    }

    // If older createBodyCell(String, Font) exists, you can keep a convenience overload:
    private PdfPCell createBodyCell(String text, Font font) {
        return createBodyCell(text, font, 0, Element.ALIGN_RIGHT);
    }

    public byte[] generatePreviewPDF(Map<String, Object> invoiceData) throws DocumentException, IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document();
        PdfWriter.getInstance(document, baos);

        document.open();

        // Define professional fonts and colors for preview
        Font titleFont = new Font(Font.FontFamily.HELVETICA, 24, Font.BOLD, BaseColor.DARK_GRAY);
        Font headerFont = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, BaseColor.WHITE);
        Font normalFont = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, BaseColor.DARK_GRAY);
        Font smallFont = new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL, BaseColor.GRAY);
        Font accentFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, new BaseColor(41, 128, 185)); // Professional blue
        
        // Define professional colors
        BaseColor primaryColor = new BaseColor(41, 128, 185); // Professional blue
        BaseColor borderGray = new BaseColor(200, 200, 200); // Border gray
        BaseColor accentGreen = new BaseColor(39, 174, 96); // Success green

        // ---------------- HEADER: Title + Logo ----------------
        PdfPTable headerTable = new PdfPTable(3);
        headerTable.setWidthPercentage(100);
        headerTable.setSpacingAfter(8);
        headerTable.setWidths(new float[] { 4f, 2f, 4f });

        // Empty left cell for spacing
        PdfPCell leftEmptyCell = new PdfPCell(new Phrase(""));
        leftEmptyCell.setBorder(Rectangle.NO_BORDER);
        headerTable.addCell(leftEmptyCell);

        // Invoice Title with professional styling - centered
        PdfPCell titleCell = new PdfPCell(new Phrase("INVOICE", titleFont));
        titleCell.setBorder(Rectangle.NO_BORDER);
        titleCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        titleCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        titleCell.setPadding(10);
        titleCell.setBackgroundColor(new BaseColor(248, 249, 250)); // Subtle background
        headerTable.addCell(titleCell);

        // Logo cell with better styling
        PdfPCell logocell;

// Check if supplierName matches tenant name
        if (invoiceData.getOrDefault("supplierName", null) != null) {
            Tenant tenant = loggedInUserUtils.getLoggedInUser().getTenant();

            if (tenant != null &&
                    tenant.getTenantName() != null &&
                    invoiceData.getOrDefault("supplierName", "").toString().equalsIgnoreCase(tenant.getTenantName()) &&
                    tenant.getTenantLogo() != null) {

                // Tenant name matches supplier name AND logo exists - show logo
                try {
                    Image logo = Image.getInstance(tenant.getTenantLogo());
                    logo.scaleToFit(120f, 60f); // Adjust size as needed
                    logocell = new PdfPCell(logo);
                    logocell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                    logocell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                } catch (Exception e) {
                    log.warn("Failed to load tenant logo, using placeholder", e);
                    logocell = new PdfPCell(new Phrase("", titleFont));
                }
            } else {
                // Supplier name doesn't match OR no logo - no placeholder
                logocell = new PdfPCell(new Phrase("", titleFont));
            }
        } else {
            // No supplier name - no logo
            logocell = new PdfPCell(new Phrase("", titleFont));
        }

        logocell.setBorder(Rectangle.NO_BORDER);
        logocell.setPadding(10);
        headerTable.addCell(logocell);

        document.add(headerTable);

        // Add a professional separator line
        LineSeparator separator = new LineSeparator();
        separator.setLineColor(new BaseColor(200, 200, 200));
        separator.setLineWidth(1f);
        document.add(separator);
        document.add(new Paragraph(" ")); // Add some spacing

        // ---------------- INVOICE META + SUPPLIER ----------------
        PdfPTable metaTable = new PdfPTable(2);
        metaTable.setWidthPercentage(100);
        metaTable.setWidths(new float[] { 5f, 5f });
        metaTable.setSpacingAfter(10);

        // Left: Invoice info
        PdfPCell leftMeta = new PdfPCell();
        leftMeta.setBorder(Rectangle.BOX);
        leftMeta.setBorderColor(borderGray);
        leftMeta.setPadding(10);
        leftMeta.setBackgroundColor(BaseColor.WHITE);
        
        Paragraph invoiceIdPara = new Paragraph("Invoice ID: ", normalFont);
        invoiceIdPara.add(new Chunk(invoiceData.getOrDefault("invoiceId", "").toString(), accentFont));
        leftMeta.addElement(invoiceIdPara);
        leftMeta.addElement(new Paragraph("Invoice Name: " + invoiceData.getOrDefault("invoiceName", ""), normalFont));
        leftMeta.addElement(new Paragraph("Invoice Date: " + invoiceData.getOrDefault("invoiceDate", ""), normalFont));
        leftMeta.addElement(new Paragraph("Bill Period: " + invoiceData.getOrDefault("fromDate", "") + " - "
                + invoiceData.getOrDefault("toDate", ""), normalFont));
        metaTable.addCell(leftMeta);

        // Right: Supplier info
        PdfPCell rightMeta = new PdfPCell();
        rightMeta.setBorder(Rectangle.BOX);
        rightMeta.setBorderColor(borderGray);
        rightMeta.setPadding(10);
        rightMeta.setBackgroundColor(BaseColor.WHITE);
        
        Paragraph supplierNamePara = new Paragraph("Supplier Name: ", normalFont);
        supplierNamePara.add(new Chunk(invoiceData.getOrDefault("supplierName", "").toString(), accentFont));
        rightMeta.addElement(supplierNamePara);
        rightMeta.addElement(
                new Paragraph("Supplier Address: " + invoiceData.getOrDefault("supplierAddress", ""), normalFont));
        rightMeta.addElement(
                new Paragraph("Supplier Info: " + invoiceData.getOrDefault("supplierInfo", ""), normalFont));
        metaTable.addCell(rightMeta);

        document.add(metaTable);

        // ---------------- CUSTOMER DETAILS ----------------
        // Use invoiceType to determine format
        String invoiceType = (String) invoiceData.getOrDefault("invoiceType", "INTERNATIONAL");
        boolean isDomestic = "DOMESTIC".equalsIgnoreCase(invoiceType);

        // Customer section header
        Paragraph customerHeader = new Paragraph("BILL TO", new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD, primaryColor));
        customerHeader.setSpacingBefore(5);
        customerHeader.setSpacingAfter(5);
        document.add(customerHeader);

        PdfPTable customerTable;
        if (isDomestic) {
            customerTable = new PdfPTable(2);
            customerTable.setWidthPercentage(100);
            customerTable.setWidths(new float[] { 5f, 5f });
        } else {
            customerTable = new PdfPTable(1);
            customerTable.setWidthPercentage(100);
        }

        // Customer name with accent styling
        Paragraph customerNamePara = new Paragraph("Customer Name: ", normalFont);
        customerNamePara.add(new Chunk(invoiceData.getOrDefault("customerName", "").toString(), accentFont));
        PdfPCell customerNameCell = new PdfPCell(customerNamePara);
        customerNameCell.setBorder(Rectangle.BOX);
        customerNameCell.setBorderColor(borderGray);
        customerNameCell.setPadding(8);
        customerNameCell.setBackgroundColor(BaseColor.WHITE);
        customerTable.addCell(customerNameCell);

        if (isDomestic) {
            PdfPCell emptyCell = new PdfPCell(new Phrase(""));
            emptyCell.setBorder(Rectangle.BOX);
            emptyCell.setBorderColor(borderGray);
            emptyCell.setPadding(8);
            emptyCell.setBackgroundColor(BaseColor.WHITE);
            customerTable.addCell(emptyCell);

            // Addresses: Bill To / Ship To
            PdfPCell billToCell = new PdfPCell(
                    new Phrase("Bill To: " + invoiceData.getOrDefault("billToAddress", ""), normalFont));
            billToCell.setBorder(Rectangle.BOX);
            billToCell.setBorderColor(borderGray);
            billToCell.setPadding(8);
            billToCell.setBackgroundColor(BaseColor.WHITE);
            customerTable.addCell(billToCell);

            PdfPCell shipToCell = new PdfPCell(
                    new Phrase("Ship To: " + invoiceData.getOrDefault("shipToAddress", ""), normalFont));
            shipToCell.setBorder(Rectangle.BOX);
            shipToCell.setBorderColor(borderGray);
            shipToCell.setPadding(8);
            shipToCell.setBackgroundColor(BaseColor.WHITE);
            customerTable.addCell(shipToCell);
        } else {
            // International format: single customer address field
            PdfPCell addressCell = new PdfPCell(
                    new Phrase("Customer Address: " + invoiceData.getOrDefault("customerInfo", ""), normalFont));
            addressCell.setBorder(Rectangle.BOX);
            addressCell.setBorderColor(borderGray);
            addressCell.setPadding(8);
            addressCell.setBackgroundColor(BaseColor.WHITE);
            customerTable.addCell(addressCell);
        }

        customerTable.setSpacingAfter(10);
        document.add(customerTable);

        // ---------------- ITEMS & EMPLOYEES TABLE ----------------
        // Add section header
        Paragraph itemsHeader = new Paragraph("ITEM DETAILS", new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD, primaryColor));
        itemsHeader.setSpacingBefore(3);
        itemsHeader.setSpacingAfter(5);
        document.add(itemsHeader);

        // 6 columns: #, Item Description, Rate, QTY, Amount, Remarks
        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 0.4f, 4.5f, 1.2f, 1.2f, 1.6f, 3.5f });
        table.setSpacingBefore(3);

        // Header row with professional styling
        String currency = invoiceData.getOrDefault("currency", "").toString();
        String amountHeader = "Amount (" + currency + ")";
        String[] headersArr = new String[] { "#", "Item Description", "Rate", "Qty", amountHeader, "Remarks" };
        for (String header : headersArr) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
            cell.setBorder(Rectangle.BOX);
            cell.setBorderColor(borderGray);
            cell.setBackgroundColor(primaryColor);
            cell.setPadding(8);
            // Align numeric headers to right, others to left
            if (header.equals("Rate") || header.equals("Quantity") || header.equals(amountHeader)) {
                cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            } else {
                cell.setHorizontalAlignment(Element.ALIGN_LEFT);
            }
            table.addCell(cell);
        }

        int rowCount = 0;
        int srNo = 1;

        // Items
        Object itemsObj = invoiceData.get("items");
        if (itemsObj instanceof List) {
            List<Map<String, Object>> items = (List<Map<String, Object>>) itemsObj;
            for (Map<String, Object> item : items) {
                table.addCell(createBodyCell(String.valueOf(srNo), normalFont, 0, Element.ALIGN_LEFT));
                // Item Description
                PdfPCell previewItemDescCell = new PdfPCell(new Phrase(item.getOrDefault("itemDesc", "").toString(), normalFont));
                previewItemDescCell.setPadding(5);
                previewItemDescCell.setBorder(Rectangle.NO_BORDER);
                previewItemDescCell.setHorizontalAlignment(Element.ALIGN_LEFT);
                previewItemDescCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                table.addCell(previewItemDescCell);
                table.addCell(createBodyCell(item.getOrDefault("rate", "").toString(), normalFont, 6, Element.ALIGN_RIGHT));
                table.addCell(createBodyCell(item.getOrDefault("quantity", "").toString(), normalFont, 5, Element.ALIGN_RIGHT));
                // Remove currency from rows:
                table.addCell(createBodyCell(item.getOrDefault("amount", "").toString(), normalFont, 10, Element.ALIGN_RIGHT));
                // Remarks
                PdfPCell previewRemarksCell = new PdfPCell(new Phrase(item.getOrDefault("remarks", "").toString(), normalFont));
                previewRemarksCell.setPadding(5);
                previewRemarksCell.setBorder(Rectangle.NO_BORDER);
                previewRemarksCell.setHorizontalAlignment(Element.ALIGN_LEFT);
                previewRemarksCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                // Allow wrapping for long remarks
                table.addCell(previewRemarksCell);
                srNo++;
                rowCount++;
            }
        }

        // Employees
        Object empObj = invoiceData.get("employees");
        if (empObj instanceof List) {
            List<Map<String, Object>> emps = (List<Map<String, Object>>) empObj;
            for (Map<String, Object> emp : emps) {
                table.addCell(createBodyCell(String.valueOf(srNo), normalFont, 0, Element.ALIGN_LEFT));
                // Employee Item Description
                PdfPCell empItemDescCell = new PdfPCell(new Phrase(emp.getOrDefault("itemDesc", "").toString(), normalFont));
                empItemDescCell.setPadding(5);
                empItemDescCell.setBorder(Rectangle.NO_BORDER);
                empItemDescCell.setHorizontalAlignment(Element.ALIGN_LEFT);
                empItemDescCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                table.addCell(empItemDescCell);
                table.addCell(createBodyCell(emp.getOrDefault("rate", "").toString(), normalFont, 6, Element.ALIGN_RIGHT));
                table.addCell(createBodyCell(emp.getOrDefault("quantity", "").toString(), normalFont, 5, Element.ALIGN_RIGHT));
                table.addCell(createBodyCell(emp.getOrDefault("amount", "").toString(), normalFont, 10, Element.ALIGN_RIGHT));
                // Remarks
                PdfPCell empPreviewRemarksCell = new PdfPCell(new Phrase(emp.getOrDefault("remarks", "").toString(), normalFont));
                empPreviewRemarksCell.setPadding(5);
                empPreviewRemarksCell.setBorder(Rectangle.NO_BORDER);
                empPreviewRemarksCell.setHorizontalAlignment(Element.ALIGN_LEFT);
                empPreviewRemarksCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                // Allow wrapping for long remarks
                table.addCell(empPreviewRemarksCell);
                srNo++;
                rowCount++;
            }
        }

        // Fill empty rows to extend table to bottom
        // int minRows = 20; // adjust based on page size
        // for (int i = rowCount; i < minRows; i++) {
        //     for (int j = 0; j < 6; j++) {
        //         table.addCell(createBodyCell(" ", normalFont));
        //     }
        // }

        document.add(table);
//        totalLabel.setBorder(Rectangle.TOP | Rectangle.BOTTOM);
//        totalLabel.setPadding(8);
//
//        PdfPCell totalValue = new PdfPCell(
//                new Phrase(invoiceData.getOrDefault("currency", "") + " " + invoiceData.getOrDefault("totalAmount", ""),
//                        headerFont));
//        totalValue.setColspan(1);
//        totalValue.setHorizontalAlignment(Element.ALIGN_LEFT);

        // ---------------------- TAXES AND DISCOUNT CALCULATIONS ----------------------
        BigDecimal subtotal = BigDecimal.ZERO;
        try {
            if (invoiceData.get("totalAmount") != null) {
                subtotal = new BigDecimal(invoiceData.get("totalAmount").toString());
            }
        } catch (Exception e) {
            log.warn("Failed to parse totalAmount from invoice data: {}", e.getMessage());
        }
        
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal totalTaxAmount = BigDecimal.ZERO;
        BigDecimal grandTotal = subtotal;

        // Calculate discount amount if discount percent is present
        BigDecimal discountPercent = BigDecimal.ZERO;
        try {
            if (invoiceData.get("discountPercent") != null) {
                discountPercent = new BigDecimal(invoiceData.get("discountPercent").toString());
                if (discountPercent.compareTo(BigDecimal.ZERO) > 0) {
                    discountAmount = subtotal.multiply(discountPercent).divide(new BigDecimal("100"), RoundingMode.HALF_UP);
                    grandTotal = subtotal.subtract(discountAmount);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to calculate discount: {}", e.getMessage());
        }

        // Calculate total tax amount
        Object taxesObj = invoiceData.get("taxes");
        if (taxesObj instanceof List) {
            List<Map<String, Object>> taxes = (List<Map<String, Object>>) taxesObj;
            for (Map<String, Object> taxData : taxes) {
                try {
                    if (taxData.get("taxPercentage") != null) {
                        BigDecimal taxPercentage = new BigDecimal(taxData.get("taxPercentage").toString());
                        if (taxPercentage.compareTo(BigDecimal.ZERO) > 0) {
                            BigDecimal taxAmount = grandTotal.subtract(totalTaxAmount).multiply(taxPercentage).divide(new BigDecimal("100"), RoundingMode.HALF_UP);
                            totalTaxAmount = totalTaxAmount.add(taxAmount);
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to calculate tax amount: {}", e.getMessage());
                }
            }
            grandTotal = grandTotal.add(totalTaxAmount);
        }

        // ---------------------- SUMMARY SECTION ----------------------
        // Create a right-aligned summary table with 2 columns
        PdfPTable summaryWrapper = new PdfPTable(1);
        summaryWrapper.setWidthPercentage(40);
        summaryWrapper.setHorizontalAlignment(Element.ALIGN_RIGHT);
        summaryWrapper.setSpacingBefore(5);
        summaryWrapper.setSpacingAfter(5);
        
        // SUMMARY header cell
        PdfPCell summaryTitleCell = new PdfPCell(new Phrase("SUMMARY", new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, primaryColor)));
        summaryTitleCell.setBorder(Rectangle.NO_BORDER);
        summaryTitleCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        summaryTitleCell.setPaddingBottom(8);
        summaryWrapper.addCell(summaryTitleCell);
        
        // Create the summary content table (2 columns: label and value)
        PdfPTable summaryContent = new PdfPTable(2);
        summaryContent.setWidthPercentage(100);
        summaryContent.setWidths(new float[] { 2f, 1f });
        
        Font summaryLabelFont = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, BaseColor.DARK_GRAY);
        Font summaryValueFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BaseColor.DARK_GRAY);
        Font grandTotalFont = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, BaseColor.WHITE);
        
        // Subtotal row
        PdfPCell subtotalLabelCell = new PdfPCell(new Phrase("Subtotal -", summaryLabelFont));
        subtotalLabelCell.setBorder(Rectangle.NO_BORDER);
        subtotalLabelCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        subtotalLabelCell.setPadding(3);
        summaryContent.addCell(subtotalLabelCell);
        
        PdfPCell subtotalValueCell = new PdfPCell(new Phrase(String.valueOf(subtotal), summaryValueFont));
        subtotalValueCell.setBorder(Rectangle.NO_BORDER);
        subtotalValueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        subtotalValueCell.setPadding(3);
        summaryContent.addCell(subtotalValueCell);
        
        // Discount row if applicable
        if (discountAmount.compareTo(BigDecimal.ZERO) > 0) {
            PdfPCell discountLabelCell = new PdfPCell(new Phrase("Discount (" + discountPercent + "%) -", summaryLabelFont));
            discountLabelCell.setBorder(Rectangle.NO_BORDER);
            discountLabelCell.setHorizontalAlignment(Element.ALIGN_LEFT);
            discountLabelCell.setPadding(3);
            summaryContent.addCell(discountLabelCell);
            
            PdfPCell discountValueCell = new PdfPCell(new Phrase("(" + String.valueOf(discountAmount) + ")", new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, accentGreen)));
            discountValueCell.setBorder(Rectangle.NO_BORDER);
            discountValueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            discountValueCell.setPadding(3);
            summaryContent.addCell(discountValueCell);
        }
        
        // Tax rows
        if (taxesObj instanceof List) {
            List<Map<String, Object>> taxes = (List<Map<String, Object>>) taxesObj;
            for (Map<String, Object> taxData : taxes) {
                try {
                    if (taxData.get("taxPercentage") != null) {
                        BigDecimal taxPercentage = new BigDecimal(taxData.get("taxPercentage").toString());
                        if (taxPercentage.compareTo(BigDecimal.ZERO) > 0) {
                            BigDecimal taxAmount = grandTotal.subtract(totalTaxAmount).multiply(taxPercentage).divide(new BigDecimal("100"), RoundingMode.HALF_UP);
                            String taxName = taxData.getOrDefault("taxName", "").toString();
                            String taxLabel = "Tax " + taxName + " (" + taxPercentage + "%) -";
                            
                            PdfPCell taxLabelCell = new PdfPCell(new Phrase(taxLabel, summaryLabelFont));
                            taxLabelCell.setBorder(Rectangle.NO_BORDER);
                            taxLabelCell.setHorizontalAlignment(Element.ALIGN_LEFT);
                            taxLabelCell.setPadding(3);
                            summaryContent.addCell(taxLabelCell);
                            
                            PdfPCell taxValueCell = new PdfPCell(new Phrase(String.valueOf(taxAmount), summaryValueFont));
                            taxValueCell.setBorder(Rectangle.NO_BORDER);
                            taxValueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                            taxValueCell.setPadding(3);
                            summaryContent.addCell(taxValueCell);
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to process tax row: {}", e.getMessage());
                }
            }
        }
        
        // Grand Total row with background
        PdfPCell grandTotalLabelCell = new PdfPCell(new Phrase("Grand Total -", grandTotalFont));
        grandTotalLabelCell.setBorder(Rectangle.BOX);
        grandTotalLabelCell.setBorderColor(borderGray);
        grandTotalLabelCell.setBackgroundColor(primaryColor);
        grandTotalLabelCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        grandTotalLabelCell.setPadding(6);
        summaryContent.addCell(grandTotalLabelCell);
        
        PdfPCell grandTotalValueCell = new PdfPCell(new Phrase(String.valueOf(grandTotal), grandTotalFont));
        grandTotalValueCell.setBorder(Rectangle.BOX);
        grandTotalValueCell.setBorderColor(borderGray);
        grandTotalValueCell.setBackgroundColor(primaryColor);
        grandTotalValueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        grandTotalValueCell.setPadding(6);
        summaryContent.addCell(grandTotalValueCell);
        
        // Add summary content to wrapper
        PdfPCell contentCell = new PdfPCell(summaryContent);
        contentCell.setBorder(Rectangle.NO_BORDER);
        summaryWrapper.addCell(contentCell);
        
        document.add(summaryWrapper);

        // Amount in words
        try {
            if (grandTotal != null) {
                String amountWords = convertAmountToWords(grandTotal, invoiceData.getOrDefault("currency", "").toString());
                Paragraph amountWordsPara = new Paragraph("Amount (in words): " + amountWords, smallFont);
                amountWordsPara.setSpacingBefore(5);
                document.add(amountWordsPara);
            }
        } catch (Exception ignored) {
        }

        // Invoice remarks
        if (invoiceData.get("remarks") != null && !invoiceData.get("remarks").toString().trim().isEmpty()) {
            Paragraph remarksHeader = new Paragraph("REMARKS", new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, primaryColor));
            remarksHeader.setSpacingBefore(8);
            remarksHeader.setSpacingAfter(3);
            document.add(remarksHeader);
            
            Paragraph remarksPara = new Paragraph(invoiceData.get("remarks").toString(), normalFont);
            remarksPara.setSpacingBefore(3);
            remarksPara.setSpacingAfter(8);
            document.add(remarksPara);
        }

        // Add professional signature section
        PdfPTable signatureTable = new PdfPTable(3);
        signatureTable.setWidthPercentage(100);
        signatureTable.setWidths(new float[] { 3f, 2f, 3f });
        signatureTable.setSpacingBefore(15);

        // Left empty cell for spacing
        PdfPCell leftSignatureEmpty = new PdfPCell();
        leftSignatureEmpty.setBorder(Rectangle.NO_BORDER);
        signatureTable.addCell(leftSignatureEmpty);

        // Center: Authorized Signature
        PdfPCell signatureCell = new PdfPCell();
        signatureCell.setBorder(Rectangle.TOP);
        signatureCell.setBorderColor(borderGray);
        signatureCell.setPadding(10);
        
        Paragraph signatureLabel = new Paragraph("Authorized Signature", smallFont);
        signatureLabel.setAlignment(Element.ALIGN_CENTER);
        signatureCell.addElement(signatureLabel);
        
        signatureTable.addCell(signatureCell);

        // Right empty cell for spacing
        PdfPCell rightSignatureEmpty = new PdfPCell();
        rightSignatureEmpty.setBorder(Rectangle.NO_BORDER);
        signatureTable.addCell(rightSignatureEmpty);
        
        document.add(signatureTable);

        // Add a separator before footer
        document.add(new Paragraph(" ")); // Add spacing
        LineSeparator footerSeparator = new LineSeparator();
        footerSeparator.setLineColor(borderGray);
        footerSeparator.setLineWidth(1f);
        document.add(footerSeparator);

        // Timesheet section
        if (invoiceData.get("timesheetData") instanceof Map tsData) {
            Object entriesObj = tsData.get("entries");
            if (entriesObj instanceof List && !((List<?>) entriesObj).isEmpty()) {
                document.newPage();
                addTimesheetSectionFromMap(document, tsData, headerFont, normalFont, smallFont);
            }
        }

        // Footer
        try {
            Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
            addContactFooter(document, tenantId, smallFont);
        } catch (Exception e) {
            log.warn("Failed to add contact footer to preview PDF: {}", e.getMessage());
        }

        document.close();
        return baos.toByteArray();
    }

    // Helper method to safely format dates (assuming this doesn't exist)

    private String formatLocalDateTimeWithSuffix(LocalDateTime dateTime) {
        if (dateTime == null) {
            return ""; // Return empty string for null values
        }
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MMM-yyyy");
        return dateTime.format(formatter);
    }

    private String formatDateWithSuffix(LocalDate date) {
        if (date == null) {
            return ""; // Return empty string for null values
        }
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MMM-yyyy");
        return date.format(formatter);
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

    // Convert a BigDecimal amount into words with simple currency handling
    private String convertAmountToWords(java.math.BigDecimal amount, String currency) {
        if (amount == null)
            return "";
        java.math.BigDecimal abs = amount.abs();
        long whole = abs.longValue();
        int fraction = abs.subtract(new java.math.BigDecimal(whole)).movePointRight(2)
                .setScale(0, java.math.RoundingMode.HALF_UP).intValue();

        String majorName;
        String minorName;
        switch (currency == null ? "" : currency) {
            case "INR":
                majorName = "Rupee";
                minorName = "Paise";
                break;
            case "EUR":
                majorName = "Euro";
                minorName = "Cent";
                break;
            case "GBP":
                majorName = "Pound";
                minorName = "Pence";
                break;
            case "JPY":
                majorName = "Yen";
                minorName = "Sen";
                break;
            case "CAD":
            case "AUD":
            case "USD":
            default:
                majorName = "Dollar";
                minorName = "Cent";
                break;
        }

        String words = numberToWords(whole) + " " + (whole == 1 ? majorName : (majorName + "s"));
        if (fraction > 0) {
            words += " and " + numberToWords(fraction) + " " + (fraction == 1 ? minorName : minorName);
        }
        return words;
    }

    private String numberToWords(long n) {
        if (n == 0)
            return "Zero";
        if (n < 0)
            return "Minus " + numberToWords(-n);

        String[] units = { "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven",
                "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen" };
        String[] tens = { "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety" };

        StringBuilder sb = new StringBuilder();

        if (n / 1000000000 > 0) {
            sb.append(numberToWords(n / 1000000000)).append(" Billion");
            n %= 1000000000;
            if (n > 0)
                sb.append(" ");
        }
        if (n / 1000000 > 0) {
            sb.append(numberToWords(n / 1000000)).append(" Million");
            n %= 1000000;
            if (n > 0)
                sb.append(" ");
        }
        if (n / 1000 > 0) {
            sb.append(numberToWords(n / 1000)).append(" Thousand");
            n %= 1000;
            if (n > 0)
                sb.append(" ");
        }
        if (n / 100 > 0) {
            sb.append(numberToWords(n / 100)).append(" Hundred");
            n %= 100;
            if (n > 0)
                sb.append(" ");
        }
        if (n > 0) {
            if (n < 20)
                sb.append(units[(int) n]);
            else {
                sb.append(tens[(int) (n / 10)]);
                if (n % 10 > 0)
                    sb.append(" ").append(units[(int) (n % 10)]);
            }
        }
        return sb.toString();
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
        dto.setBillToAddress(invoice.getBillToAddress());
        dto.setShipToAddress(invoice.getShipToAddress());
        dto.setSupplierName(invoice.getSupplierName());
        dto.setSupplierAddress(invoice.getSupplierAddress());

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

        // Attachments
        dto.setAttachmentCount(invoice.getAttachmentCount());
        dto.setAttachmentFileNames(invoice.getAttachmentFileNames());

        // Map taxes to DTOs
        if (invoice.getInvoiceTaxes() != null) {
            List<InvoiceTaxDTO> taxDTOs = invoice.getInvoiceTaxes()
                    .stream()
                    .map(tax -> {
                        InvoiceTaxDTO taxDTO = new InvoiceTaxDTO();
                        taxDTO.setTaxName(tax.getTaxName());
                        taxDTO.setTaxPercentage(tax.getTaxPercentage());
                        taxDTO.setTaxNumber(tax.getTaxNumber());
                        return taxDTO;
                    })
                    .collect(Collectors.toList());

            dto.setTaxes(taxDTOs);
        }

        dto.setDiscountPercent(invoice.getDiscountPercent());
        dto.setDueDate(invoice.getDueDate());

        // ✅ Map Invoice Items
        if (invoice.getInvoiceItems() != null) {
            List<InvoiceItem> itemDTOs = invoice.getInvoiceItems()
                    .stream()
                    .map(item -> {
                        InvoiceItem itemDTO = new InvoiceItem();
                        itemDTO.setItemId(item.getItemId());
                        itemDTO.setItemDesc(item.getItemDesc());
                        itemDTO.setRate(item.getRate());
                        itemDTO.setQuantity(item.getQuantity());
                        itemDTO.setAmount(item.getAmount());
                        itemDTO.setRemarks(item.getRemarks());
                        itemDTO.setUpdatedTs(item.getUpdatedTs());
                        itemDTO.setUpdatedBy(item.getUpdatedBy());
                        return itemDTO;
                    })
                    .collect(Collectors.toList());

            dto.setItems(itemDTOs);
        }

        // Map Invoice Employees
        if (invoice.getInvoiceEmployees() != null) {
            List<InvoiceEmployee> employeeDTOs = invoice.getInvoiceEmployees()
                    .stream()
                    .map(emp -> {
                        InvoiceEmployee empDTO = new InvoiceEmployee();
                        empDTO.setItemId(emp.getItemId());
                        empDTO.setInvoice(emp.getInvoice());
                        empDTO.setItemDesc(emp.getItemDesc());
                        empDTO.setRate(emp.getRate());
                        empDTO.setQuantity(emp.getQuantity());
                        empDTO.setAmount(emp.getAmount());
                        empDTO.setRemarks(emp.getRemarks());
                        empDTO.setUpdatedTs(emp.getUpdatedTs());
                        empDTO.setUpdatedBy(emp.getUpdatedBy());
                        return empDTO;
                    })
                    .collect(Collectors.toList());

            dto.setEmployees(employeeDTOs);
        }

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

            Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();

            List<Invoice> invoices = invoiceRepository.findByTenantIdAndDeletedFalseOrderByCreatedAtDesc(tenantId);
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
            Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
            List<Project> projects = projectRepository.findByTenantTenantIdAndEndTimestampIsNull(tenantId);
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

    /**
     * Add contact information footer to PDF document using real tenant data
     */
    private void addContactFooter(Document document, Long tenantId, Font font) throws DocumentException {
        try {
            if (tenantId == null) {
                log.warn("Tenant ID is null, cannot add contact footer");
                return;
            }

            // Fetch real tenant data from database
            Optional<Tenant> tenantOpt = tenantRepository.findById(tenantId);
            if (!tenantOpt.isPresent()) {
                log.warn("Tenant not found for ID: {}, cannot add contact footer", tenantId);
                return;
            }

            Tenant tenant = tenantOpt.get();
            log.debug("Adding contact footer for tenant ID: {}, Name: {}", tenantId, tenant.getTenantName());

            // Build contact information from real tenant data
            StringBuilder contactInfo = new StringBuilder();

            // Contact Name - from tenant_contact_name
            if (tenant.getTenantContactName() != null && !tenant.getTenantContactName().trim().isEmpty()) {
                contactInfo.append("Contact Name: ").append(tenant.getTenantContactName().trim());
            }

            // Email - from tenant_contact_email
            if (tenant.getTenantContactEmail() != null && !tenant.getTenantContactEmail().trim().isEmpty()) {
                if (contactInfo.length() > 0) {
                    contactInfo.append(" | ");
                }
                contactInfo.append("Email: ").append(tenant.getTenantContactEmail().trim());
            }

            // Contact Number - from tenant_contact_phone
            if (tenant.getTenantContactPhone() != null && !tenant.getTenantContactPhone().trim().isEmpty()) {
                if (contactInfo.length() > 0) {
                    contactInfo.append(" | ");
                }
                contactInfo.append("Contact Number: ").append(tenant.getTenantContactPhone().trim());
            }

            // Mailing Address - from tenant_address_line1, line2, line3, and postal_code
            StringBuilder address = new StringBuilder();
            if (tenant.getTenantAddressLine1() != null && !tenant.getTenantAddressLine1().trim().isEmpty()) {
                address.append(tenant.getTenantAddressLine1().trim());
            }
            if (tenant.getTenantAddressLine2() != null && !tenant.getTenantAddressLine2().trim().isEmpty()) {
                if (address.length() > 0) {
                    address.append(", ");
                }
                address.append(tenant.getTenantAddressLine2().trim());
            }
            if (tenant.getTenantAddressLine3() != null && !tenant.getTenantAddressLine3().trim().isEmpty()) {
                if (address.length() > 0) {
                    address.append(", ");
                }
                address.append(tenant.getTenantAddressLine3().trim());
            }
            if (tenant.getTenantAddressPostalCode() != null && !tenant.getTenantAddressPostalCode().trim().isEmpty()) {
                if (address.length() > 0) {
                    address.append(", ");
                }
                address.append(tenant.getTenantAddressPostalCode().trim());
            }

            if (address.length() > 0) {
                if (contactInfo.length() > 0) {
                    contactInfo.append(" | ");
                }
                contactInfo.append("Mailing Address: ").append(address.toString());
            }

            // Only add footer if there's real contact information from database
            if (contactInfo.length() > 0) {

                Paragraph spacer = new Paragraph();
                spacer.setSpacingBefore(20);
                document.add(spacer);

                LineSeparator separator = new LineSeparator();
                separator.setLineWidth(0.5f); // thin line
                separator.setPercentage(100f); // full width horizontal line
                document.add(new Chunk(separator));
                // Slight spacing after the line


                Paragraph footer = new Paragraph(contactInfo.toString(), font);
                footer.setAlignment(Element.ALIGN_LEFT);
                footer.setSpacingBefore(4);
                document.add(footer);
                log.debug("Contact footer added successfully with {} characters", contactInfo.length());
            } else {
                log.warn("No contact information found for tenant ID: {}, footer not added", tenantId);
            }
        } catch (Exception e) {
            log.error("Failed to add contact footer for tenant ID {}: {}", tenantId, e.getMessage(), e);
            // Don't throw exception, just log error - PDF generation should continue
        }
    }
}