package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.InvoiceRequestDTO;
import com.Protronserver.Protronserver.Entities.Invoice;
import com.Protronserver.Protronserver.Repository.InvoiceRepository;
import com.Protronserver.Protronserver.DTOs.InvoiceResponseDTO;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
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
        document.add(new Paragraph("Invoice ID: " + invoice.getInvoiceId(), headerFont));
        document.add(new Paragraph("Invoice Name: " + invoice.getInvoiceName(), normalFont));
        String createdAtFormatted = formatLocalDateTimeWithSuffix(invoice.getCreatedAt());
        document.add(new Paragraph("Created At: " + createdAtFormatted, normalFont));
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
        workTable.addCell(new Phrase(formatDateWithSuffix(invoice.getFromDate()), normalFont));
        workTable.addCell(new Phrase("To Date:", headerFont));
        workTable.addCell(new Phrase(formatDateWithSuffix(invoice.getToDate()), normalFont));
        workTable.addCell(new Phrase("Hours Spent:", headerFont));
        workTable.addCell(new Phrase(invoice.getHoursSpent().toString(), normalFont));

        document.add(workTable);

        // Attachments info
        if (invoice.getAttachmentCount() > 0) {
            document.add(new Paragraph("Attachments:", headerFont));
            List<String> attachmentNames = invoice.getAttachmentFileNames();
            for (String fileName : attachmentNames) {
                document.add(new Paragraph("• " + fileName, normalFont));
            }
            document.add(new Paragraph(" "));
        }

        if (invoice.getRemarks() != null && !invoice.getRemarks().trim().isEmpty()) {
            PdfPTable remarksTable = new PdfPTable(3);
            remarksTable.setWidthPercentage(100);
            remarksTable.setSpacingBefore(10);
            remarksTable.setSpacingAfter(10);

            // Set column widths
            remarksTable.setWidths(new float[]{2f, 8f, 3f});

            // Header cells
            PdfPCell header1 = new PdfPCell(new Phrase("SR.NO", headerFont));
            header1.setHorizontalAlignment(Element.ALIGN_CENTER);
            remarksTable.addCell(header1);

            PdfPCell header2 = new PdfPCell(new Phrase("Remarks", headerFont));
            header2.setHorizontalAlignment(Element.ALIGN_CENTER);
            remarksTable.addCell(header2);

            PdfPCell header3 = new PdfPCell(new Phrase("Amount", headerFont));
            header3.setHorizontalAlignment(Element.ALIGN_CENTER);
            remarksTable.addCell(header3);

            // Row data
            PdfPCell cell1 = new PdfPCell(new Phrase("1", normalFont));
            cell1.setHorizontalAlignment(Element.ALIGN_CENTER);
            remarksTable.addCell(cell1);

            PdfPCell cell2 = new PdfPCell(new Phrase(invoice.getRemarks(), normalFont));
            cell2.setHorizontalAlignment(Element.ALIGN_CENTER);
            remarksTable.addCell(cell2);

            PdfPCell cell3 = new PdfPCell(new Phrase(invoice.getCurrency() + " " + invoice.getTotalAmount(), normalFont));
            cell3.setHorizontalAlignment(Element.ALIGN_CENTER);
            remarksTable.addCell(cell3);

            document.add(remarksTable);
        }

        LineSeparator ls = new LineSeparator();
        ls.setLineWidth(1f); // thickness
        ls.setPercentage(100); // full page width
        document.add(new Chunk(ls));

        // Total amount
        Font totalFont = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD);
        Paragraph total = new Paragraph(
                "Total Amount: " + invoice.getCurrency() + " " + invoice.getTotalAmount().toString(), totalFont);
        total.setAlignment(Element.ALIGN_RIGHT);
        total.setSpacingAfter(20);
        document.add(total);

        // Add timesheet table if timesheet data is provided
        if (timesheetData != null && timesheetData.getEntries() != null && !timesheetData.getEntries().isEmpty()) {
            document.newPage();
            addTimesheetSection(document, timesheetData, headerFont, normalFont, smallFont);
        }

        document.close();
        return baos.toByteArray();
    }

    private String formatLocalDateTimeWithSuffix(LocalDateTime dateTime) {
        int day = dateTime.getDayOfMonth();
        String daySuffix;
        if (day >= 11 && day <= 13) {
            daySuffix = "th";
        } else {
            switch (day % 10) {
                case 1:  daySuffix = "st"; break;
                case 2:  daySuffix = "nd"; break;
                case 3:  daySuffix = "rd"; break;
                default: daySuffix = "th"; break;
            }
        }
        DateTimeFormatter monthYearFormatter = DateTimeFormatter.ofPattern("MMMM yyyy");
        return day + daySuffix + " " + dateTime.format(monthYearFormatter);
    }

    private String formatDateWithSuffix(LocalDate date) {
        int day = date.getDayOfMonth();
        String daySuffix;

        if (day >= 11 && day <= 13) {
            daySuffix = "th";
        } else {
            switch (day % 10) {
                case 1: daySuffix = "st"; break;
                case 2: daySuffix = "nd"; break;
                case 3: daySuffix = "rd"; break;
                default: daySuffix = "th";
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
        PdfPTable summaryTable = new PdfPTable(4);
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

        PdfPCell targetHoursCell = new PdfPCell(new Phrase("Target Hours", headerFont));
        targetHoursCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        summaryTable.addCell(targetHoursCell);

        // Summary data
        summaryTable.addCell(new Phrase(timesheetData.getPeriod(), normalFont));
        summaryTable.addCell(new Phrase(timesheetData.getEmployeeName(), normalFont));
        summaryTable.addCell(
                new Phrase(timesheetData.getTotalHours() + "h " + timesheetData.getTotalMinutes() + "m", normalFont));
        summaryTable.addCell(new Phrase(timesheetData.getTargetHours() + "h", normalFont));

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
                case 1:  daySuffix = "st"; break;
                case 2:  daySuffix = "nd"; break;
                case 3:  daySuffix = "rd"; break;
                default: daySuffix = "th"; break;
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
        String hoursText = (entry.getHours() != null ? entry.getHours() : 0) + "h " +
                (entry.getMinutes() != null ? entry.getMinutes() : 0) + "m";
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
}