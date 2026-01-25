package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTO.InvoiceEmployeeDTO;
import com.Protronserver.Protronserver.DTO.InvoiceItemDTO;
import com.Protronserver.Protronserver.DTOs.InvoiceRequestDTO;
import com.Protronserver.Protronserver.Entities.*;
import com.Protronserver.Protronserver.Repository.InvoiceRepository;
import com.Protronserver.Protronserver.DTOs.InvoiceResponseDTO;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
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
                    item.setLastUpdatedDate(LocalDateTime.now());
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
                    emp.setLastUpdatedDate(LocalDateTime.now());
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
                    item.setLastUpdatedDate(LocalDateTime.now());
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
                    emp.setLastUpdatedDate(LocalDateTime.now());
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
        if (invoiceOpt.isPresent() && invoiceOpt.get().getPdfData() != null) {
            return new ByteArrayResource(invoiceOpt.get().getPdfData());
        }
        throw new RuntimeException("Invoice PDF not found for ID: " + invoiceId);
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

        // Define fonts
        Font titleFont = new Font(Font.FontFamily.HELVETICA, 20, Font.BOLD);
        Font headerFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD);
        Font normalFont = new Font(Font.FontFamily.HELVETICA, 10);
        Font smallFont = new Font(Font.FontFamily.HELVETICA, 9);

        // ---------------------- HEADER: Title + Logo ----------------------
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setSpacingAfter(5);
        headerTable.setWidths(new float[]{6f, 4f}); // Title left, logo right

        // Invoice Title on left
        PdfPCell titleCell = new PdfPCell(new Phrase("INVOICE", titleFont));
        titleCell.setBorder(Rectangle.NO_BORDER);
        titleCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        headerTable.addCell(titleCell);

        PdfPCell logocell = new PdfPCell(new Phrase("LOGO", titleFont));
        logocell.setBorder(Rectangle.NO_BORDER);
        logocell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        headerTable.addCell(logocell);

        document.add(headerTable);

        // ---------------------- INVOICE META + SUPPLIER ----------------------
        PdfPTable metaTable = new PdfPTable(2);
        metaTable.setWidthPercentage(100);
        metaTable.setWidths(new float[]{5f, 5f});

        // Left side: Invoice ID, Invoice Date, Bill Period, Invoice Name
        PdfPCell leftMetaCell = new PdfPCell();
        leftMetaCell.setBorder(Rectangle.NO_BORDER);
        leftMetaCell.addElement(new Paragraph("Invoice ID: " + invoice.getInvoiceId(), normalFont));
        leftMetaCell.addElement(new Paragraph("Invoice Name: " + invoice.getInvoiceName(), normalFont));
        leftMetaCell.addElement(new Paragraph("Invoice Date: " + formatLocalDateTimeWithSuffix(invoice.getCreatedAt()), normalFont));
        leftMetaCell.addElement(new Paragraph("Bill Period: "
                + (invoice.getFromDate() != null ? invoice.getFromDate() : "")
                + " - "
                + (invoice.getToDate() != null ? invoice.getToDate() : ""), normalFont));
        metaTable.addCell(leftMetaCell);

        // Right side: Supplier Details
        PdfPCell rightMetaCell = new PdfPCell();
        rightMetaCell.setBorder(Rectangle.NO_BORDER);
        rightMetaCell.addElement(new Paragraph("Supplier Name: " + invoice.getSupplierName(), normalFont));
        rightMetaCell.addElement(new Paragraph("Supplier Address: " + (invoice.getShipToAddress() != null ? invoice.getShipToAddress() : ""), normalFont));
        rightMetaCell.addElement(new Paragraph("Supplier Info: " + (invoice.getSupplierInfo() != null ? invoice.getSupplierInfo() : ""), normalFont));
        metaTable.addCell(rightMetaCell);

        metaTable.setSpacingAfter(20);
        document.add(metaTable);

        // ---------------------- CUSTOMER DETAILS ----------------------
        PdfPTable customerTable;
        if(invoice.getCountry().equalsIgnoreCase("india")){
            customerTable = new PdfPTable(2);
            customerTable.setWidthPercentage(100);
            customerTable.setWidths(new float[]{5f, 5f});
        }else{
            customerTable = new PdfPTable(1);
            customerTable.setWidthPercentage(100);
        }



        PdfPCell customerNameCell = new PdfPCell(new Phrase("Customer Name: " + invoice.getCustomerName(), normalFont));
        customerNameCell.setBorder(Rectangle.NO_BORDER);
        customerTable.addCell(customerNameCell);

        if(invoice.getCountry().equalsIgnoreCase("india")){
            // Empty right side to balance table
            PdfPCell emptyCell = new PdfPCell(new Phrase(""));
            emptyCell.setBorder(Rectangle.NO_BORDER);
            customerTable.addCell(emptyCell);
        }

        if(invoice.getCountry().equalsIgnoreCase("india")){
            // Addresses in one line: Bill To (left), Ship To (right)
            PdfPCell billToCell = new PdfPCell(new Phrase("Bill To: " + (invoice.getBillToAddress() != null ? invoice.getBillToAddress() : ""), normalFont));
            billToCell.setBorder(Rectangle.NO_BORDER);
            customerTable.addCell(billToCell);

            PdfPCell shipToCell = new PdfPCell(new Phrase("Ship To: " + (invoice.getShipToAddress() != null ? invoice.getShipToAddress() : ""), normalFont));
            shipToCell.setBorder(Rectangle.NO_BORDER);
            customerTable.addCell(shipToCell);
        }else{
            PdfPCell addressCell = new PdfPCell(new Phrase("Customer Address: " + (invoice.getCustomerAddress() != null ? invoice.getCustomerAddress() : ""), normalFont));
            addressCell.setBorder(Rectangle.NO_BORDER);
            customerTable.addCell(addressCell);
        }



        customerTable.setSpacingAfter(20);
        document.add(customerTable);

        /// ---------------------- ITEMS & EMPLOYEES TABLE ----------------------
        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{4f, 2f, 2f, 3f, 4f});

// Header row with top/bottom border
        for (String header : new String[]{"Item Description", "Rate", "Quantity", "Amount (" + invoice.getCurrency() + ")", "Remarks"}) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
            cell.setBorder(Rectangle.TOP | Rectangle.BOTTOM);
            cell.setBackgroundColor(BaseColor.LIGHT_GRAY);
            cell.setPadding(5);
            table.addCell(cell);
        }

// Add items and employees in same table
        int rowCount = 0;

// ----------- Invoice Items -----------
        if (invoice.getInvoiceItems() != null) {
            for (InvoiceItem item : invoice.getInvoiceItems()) {
                table.addCell(createBodyCell(item.getItemDesc(), normalFont));
                table.addCell(createBodyCell(String.valueOf(item.getRate()), normalFont));
                table.addCell(createBodyCell(String.valueOf(item.getQuantity()), normalFont));
                table.addCell(createBodyCell(invoice.getCurrency() + " " + item.getAmount(), normalFont));
                table.addCell(createBodyCell(item.getRemarks() != null ? item.getRemarks() : "", normalFont));
                rowCount++;
            }
        }

// ----------- Invoice Employees -----------
        if (invoice.getInvoiceEmployees() != null) {
            for (InvoiceEmployee emp : invoice.getInvoiceEmployees()) {
                table.addCell(createBodyCell(emp.getItemDesc(), normalFont));
                table.addCell(createBodyCell(String.valueOf(emp.getRate()), normalFont));
                table.addCell(createBodyCell(String.valueOf(emp.getQuantity()), normalFont));
                table.addCell(createBodyCell(invoice.getCurrency() + " " + emp.getAmount(), normalFont));
                table.addCell(createBodyCell(emp.getRemarks() != null ? emp.getRemarks() : "", normalFont));
                rowCount++;
            }
        }

// ----------- Add empty rows to fill page -----------
        int minRows = 20; // Adjust this as needed for page size
        for (int i = rowCount; i < minRows; i++) {
            for (int j = 0; j < 5; j++) {
                table.addCell(createBodyCell(" ", normalFont));
            }
        }

// ----------- Grand Total Row -----------
        PdfPCell totalLabel = new PdfPCell(new Phrase("Grand Total", headerFont));
        totalLabel.setColspan(4);
        totalLabel.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalLabel.setBackgroundColor(BaseColor.LIGHT_GRAY);
        totalLabel.setBorder(Rectangle.TOP | Rectangle.BOTTOM);
        totalLabel.setPadding(8);

        PdfPCell totalValue = new PdfPCell(new Phrase(invoice.getCurrency() + " " + invoice.getTotalAmount(), headerFont));
        totalValue.setColspan(2);
        totalValue.setHorizontalAlignment(Element.ALIGN_LEFT);
        totalValue.setBackgroundColor(BaseColor.LIGHT_GRAY);
        totalValue.setBorder(Rectangle.TOP | Rectangle.BOTTOM);
        totalValue.setPadding(8);

        table.addCell(totalLabel);
        table.addCell(totalValue);

        document.add(table);

        // Amount in words
        try {
            if (invoice.getTotalAmount() != null) {
                String amountWords = convertAmountToWords(invoice.getTotalAmount(), invoice.getCurrency());
                Paragraph amountWordsPara = new Paragraph("Amount (in words): " + amountWords, smallFont);
                amountWordsPara.setSpacingBefore(8);
                document.add(amountWordsPara);
                log.info("Added amount-in-words to PDF for invoice {}: {}", invoice.getInvoiceId(), amountWords);
            }
        } catch (Exception e) {
            log.warn("Failed to convert amount to words for invoice {}: {}", invoice.getInvoiceId(), e.getMessage());
        }

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

    private PdfPCell createBodyCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.NO_BORDER); // Only top/bottom borders
        cell.setPadding(5);
        return cell;
    }


    public byte[] generatePreviewPDF(Map<String, Object> invoiceData) throws DocumentException, IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document();
        PdfWriter.getInstance(document, baos);

        document.open();

        // Fonts
        Font titleFont = new Font(Font.FontFamily.HELVETICA, 20, Font.BOLD);
        Font headerFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD);
        Font normalFont = new Font(Font.FontFamily.HELVETICA, 10);
        Font smallFont = new Font(Font.FontFamily.HELVETICA, 9);

        // ---------------- HEADER: Title + Logo ----------------
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{6f, 4f});
        headerTable.setSpacingAfter(5);

        PdfPCell titleCell = new PdfPCell(new Phrase("INVOICE", titleFont));
        titleCell.setBorder(Rectangle.NO_BORDER);
        titleCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        headerTable.addCell(titleCell);

        PdfPCell logoCell = new PdfPCell(new Phrase("LOGO", titleFont)); // replace with actual image if available
        logoCell.setBorder(Rectangle.NO_BORDER);
        logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        headerTable.addCell(logoCell);

        document.add(headerTable);

        // ---------------- INVOICE META + SUPPLIER ----------------
        PdfPTable metaTable = new PdfPTable(2);
        metaTable.setWidthPercentage(100);
        metaTable.setWidths(new float[]{5f, 5f});

        // Left: Invoice info
        PdfPCell leftMeta = new PdfPCell();
        leftMeta.setBorder(Rectangle.NO_BORDER);
        leftMeta.addElement(new Paragraph("Invoice ID: " + invoiceData.getOrDefault("invoiceId", ""), normalFont));
        leftMeta.addElement(new Paragraph("Invoice Name: " + invoiceData.getOrDefault("invoiceName", ""), normalFont));
        leftMeta.addElement(new Paragraph("Invoice Date: " + invoiceData.getOrDefault("invoiceDate", ""), normalFont));
        leftMeta.addElement(new Paragraph("Bill Period: " + invoiceData.getOrDefault("fromDate", "") + " - " + invoiceData.getOrDefault("toDate", ""), normalFont));
        metaTable.addCell(leftMeta);

        // Right: Supplier info
        PdfPCell rightMeta = new PdfPCell();
        rightMeta.setBorder(Rectangle.NO_BORDER);
        rightMeta.addElement(new Paragraph("Supplier Name: " + invoiceData.getOrDefault("supplierName", ""), normalFont));
        rightMeta.addElement(new Paragraph("Supplier Address: " + invoiceData.getOrDefault("supplierAddress", ""), normalFont));
        rightMeta.addElement(new Paragraph("Supplier Info: " + invoiceData.getOrDefault("supplierInfo", ""), normalFont));
        metaTable.addCell(rightMeta);

        metaTable.setSpacingAfter(20);
        document.add(metaTable);

        // ---------------- CUSTOMER DETAILS ----------------
        PdfPTable customerTable = new PdfPTable(2);
        customerTable.setWidthPercentage(100);
        customerTable.setWidths(new float[]{5f, 5f});

        PdfPCell customerNameCell = new PdfPCell(new Phrase("Customer Name: " + invoiceData.getOrDefault("customerName", ""), normalFont));
        customerNameCell.setBorder(Rectangle.NO_BORDER);
        customerTable.addCell(customerNameCell);

        PdfPCell emptyCell = new PdfPCell(new Phrase(""));
        emptyCell.setBorder(Rectangle.NO_BORDER);
        customerTable.addCell(emptyCell);

        // Addresses: Bill To / Ship To
        PdfPCell billToCell = new PdfPCell(new Phrase("Bill To: " + invoiceData.getOrDefault("billToAddress", ""), normalFont));
        billToCell.setBorder(Rectangle.NO_BORDER);
        customerTable.addCell(billToCell);

        PdfPCell shipToCell = new PdfPCell(new Phrase("Ship To: " + invoiceData.getOrDefault("shipToAddress", ""), normalFont));
        shipToCell.setBorder(Rectangle.NO_BORDER);
        customerTable.addCell(shipToCell);

        customerTable.setSpacingAfter(20);
        document.add(customerTable);

        // ---------------- ITEMS & EMPLOYEES TABLE ----------------
        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{4f, 2f, 2f, 3f, 4f});

        // Header row: top/bottom border only
        for (String header : new String[]{"Item Description", "Rate", "Quantity", "Amount (" + invoiceData.getOrDefault("currency", "") + ")", "Remarks"}) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
            cell.setBorder(Rectangle.TOP | Rectangle.BOTTOM);
            cell.setBackgroundColor(BaseColor.LIGHT_GRAY);
            cell.setPadding(5);
            table.addCell(cell);
        }

        int rowCount = 0;

        // Items
        Object itemsObj = invoiceData.get("items");
        if (itemsObj instanceof List) {
            List<Map<String, Object>> items = (List<Map<String, Object>>) itemsObj;
            for (Map<String, Object> item : items) {
                table.addCell(createBodyCell(item.getOrDefault("itemDesc", "").toString(), normalFont));
                table.addCell(createBodyCell(item.getOrDefault("rate", "").toString(), normalFont));
                table.addCell(createBodyCell(item.getOrDefault("quantity", "").toString(), normalFont));
                table.addCell(createBodyCell(invoiceData.getOrDefault("currency", "") + " " + item.getOrDefault("amount", ""), normalFont));
                table.addCell(createBodyCell(item.getOrDefault("remarks", "").toString(), normalFont));
                rowCount++;
            }
        }

        // Employees
        Object empObj = invoiceData.get("employees");
        if (empObj instanceof List) {
            List<Map<String, Object>> emps = (List<Map<String, Object>>) empObj;
            for (Map<String, Object> emp : emps) {
                table.addCell(createBodyCell(emp.getOrDefault("itemDesc", "").toString(), normalFont));
                table.addCell(createBodyCell(emp.getOrDefault("rate", "").toString(), normalFont));
                table.addCell(createBodyCell(emp.getOrDefault("quantity", "").toString(), normalFont));
                table.addCell(createBodyCell(invoiceData.getOrDefault("currency", "") + " " + emp.getOrDefault("amount", ""), normalFont));
                table.addCell(createBodyCell(emp.getOrDefault("remarks", "").toString(), normalFont));
                rowCount++;
            }
        }

        // Fill empty rows to extend table to bottom
        int minRows = 20; // adjust based on page size
        for (int i = rowCount; i < minRows; i++) {
            for (int j = 0; j < 5; j++) {
                table.addCell(createBodyCell(" ", normalFont));
            }
        }

        // Grand total row
        PdfPCell totalLabel = new PdfPCell(new Phrase("Grand Total", headerFont));
        totalLabel.setColspan(4);
        totalLabel.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalLabel.setBackgroundColor(BaseColor.LIGHT_GRAY);
        totalLabel.setBorder(Rectangle.TOP | Rectangle.BOTTOM);
        totalLabel.setPadding(8);

        PdfPCell totalValue = new PdfPCell(new Phrase(invoiceData.getOrDefault("currency", "") + " " + invoiceData.getOrDefault("totalAmount", ""), headerFont));
        totalValue.setColspan(1);
        totalValue.setHorizontalAlignment(Element.ALIGN_LEFT);
        totalValue.setBackgroundColor(BaseColor.LIGHT_GRAY);
        totalValue.setBorder(Rectangle.TOP | Rectangle.BOTTOM);
        totalValue.setPadding(8);

        table.addCell(totalLabel);
        table.addCell(totalValue);

        document.add(table);

        // Amount in words
        try {
            if (invoiceData.get("totalAmount") != null) {
                BigDecimal amt = new BigDecimal(invoiceData.get("totalAmount").toString());
                String amountWords = convertAmountToWords(amt, invoiceData.getOrDefault("currency", "").toString());
                Paragraph amountWordsPara = new Paragraph("Amount (in words): " + amountWords, smallFont);
                amountWordsPara.setSpacingBefore(8);
                document.add(amountWordsPara);
            }
        } catch (Exception ignored) {}

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

        // ✅ Map Invoice Items
        if (invoice.getInvoiceItems() != null) {
            List<InvoiceItem> itemDTOs = invoice.getInvoiceItems()
                    .stream()
                    .map(item -> {
                        InvoiceItem itemDTO = new InvoiceItem();
                        itemDTO.setItemId(item.getItemId());
                        itemDTO.setItemId(item.getInvoice().getId());
                        itemDTO.setItemDesc(item.getItemDesc());
                        itemDTO.setRate(item.getRate());
                        itemDTO.setQuantity(item.getQuantity());
                        itemDTO.setAmount(item.getAmount());
                        itemDTO.setRemarks(item.getRemarks());
                        itemDTO.setLastUpdatedDate(item.getLastUpdatedDate());
                        itemDTO.setUpdatedBy(item.getUpdatedBy());
                        return itemDTO;
                    })
                    .collect(Collectors.toList());

            dto.setItems(itemDTOs);
        }

        // ✅ Map Invoice Employees
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
                        empDTO.setLastUpdatedDate(emp.getLastUpdatedDate());
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
                Paragraph footer = new Paragraph(contactInfo.toString(), font);
                footer.setAlignment(Element.ALIGN_CENTER);
                footer.setSpacingBefore(20);
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
