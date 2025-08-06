package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.InvoiceRequestDTO;
import com.Protronserver.Protronserver.DTOs.InvoiceResponseDTO;
import com.Protronserver.Protronserver.Service.InvoiceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {
    private static final Logger log = LoggerFactory.getLogger(InvoiceController.class);
    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private ObjectMapper objectMapper;

    @PostMapping("/generate")
    public ResponseEntity<?> generateInvoice(@Valid @RequestBody InvoiceRequestDTO requestDTO) {
        try {
            // Log timesheet data inclusion
            if (requestDTO.hasTimesheetData()) {
                log.info("Invoice generation requested with timesheet data - View: {}, Employee: {}, Total entries: {}",
                        requestDTO.getTimesheetData().getViewMode(),
                        requestDTO.getTimesheetData().getEmployeeName(),
                        requestDTO.getTimesheetData().getEntries().size());

                // Log summary of timesheet data
                InvoiceRequestDTO.TimesheetDataDTO timesheetData = requestDTO.getTimesheetData();
                log.info("Timesheet summary - Period: {}, Total time: {}h {}m, Target: {}h",
                        timesheetData.getPeriod(),
                        timesheetData.getTotalHours(),
                        timesheetData.getTotalMinutes(),
                        timesheetData.getTargetHours());
            } else {
                log.info("Invoice generation requested without timesheet data");
            }

            InvoiceResponseDTO response = invoiceService.createInvoice(requestDTO);

            log.info("Invoice generated successfully: {}", response.getInvoiceId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error generating invoice: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error generating invoice: " + e.getMessage());
        }
    }

    @PostMapping(value = "/generate-with-attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> generateInvoiceWithAttachments(
            @RequestPart("invoice") String invoiceJson,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments) {
        try {
            // Parse the JSON string to InvoiceRequestDTO
            InvoiceRequestDTO requestDTO = objectMapper.readValue(invoiceJson, InvoiceRequestDTO.class);

            // Log timesheet data inclusion
            if (requestDTO.hasTimesheetData()) {
                log.info(
                        "Invoice with attachments generation requested with timesheet data - View: {}, Employee: {}, Total entries: {}",
                        requestDTO.getTimesheetData().getViewMode(),
                        requestDTO.getTimesheetData().getEmployeeName(),
                        requestDTO.getTimesheetData().getEntries().size());

                // Log detailed timesheet information
                InvoiceRequestDTO.TimesheetDataDTO timesheetData = requestDTO.getTimesheetData();
                log.info("Timesheet details - Period: {}, Total time: {}h {}m, Target: {}h",
                        timesheetData.getPeriod(),
                        timesheetData.getTotalHours(),
                        timesheetData.getTotalMinutes(),
                        timesheetData.getTargetHours());

                // Log breakdown by date (for debugging)
                int loggedTasks = 0;
                for (InvoiceRequestDTO.TimesheetEntryDTO entry : timesheetData.getEntries()) {
                    if (entry.getHours() > 0 || entry.getMinutes() > 0) {
                        loggedTasks++;
                    }
                }
                log.info("Timesheet contains {} task entries with logged time", loggedTasks);
            } else {
                log.info("Invoice with attachments generation requested without timesheet data");
            }

            // Validate attachments
            if (attachments != null && attachments.size() > 4) {
                log.warn("Too many attachments provided: {}. Maximum allowed: 4", attachments.size());
                return ResponseEntity.badRequest()
                        .body("Maximum 4 attachments allowed. You provided " + attachments.size());
            }

            // Filter out empty files
            List<MultipartFile> validAttachments = new ArrayList<>();
            if (attachments != null) {
                for (MultipartFile file : attachments) {
                    if (file != null && !file.isEmpty()) {
                        validAttachments.add(file);
                    }
                }
                log.info("Processing {} valid attachments", validAttachments.size());
            }

            InvoiceResponseDTO response;
            if (validAttachments.isEmpty()) {
                // No attachments, use regular method
                response = invoiceService.createInvoice(requestDTO);
            } else {
                // With attachments
                response = invoiceService.createInvoiceWithAttachments(requestDTO, validAttachments);
            }

            log.info("Invoice with attachments generated successfully: {}", response.getInvoiceId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error generating invoice with attachments: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error generating invoice with attachments: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<InvoiceResponseDTO>> getAllInvoices() {
        List<InvoiceResponseDTO> invoices = invoiceService.getAllInvoices();
        log.info("Retrieved {} invoices", invoices.size());
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInvoiceById(@PathVariable Long id) {
        return invoiceService.getInvoiceById(id)
                .map(invoice -> {
                    log.info("Retrieved invoice by ID: {}", id);
                    return ResponseEntity.ok(invoice);
                })
                .orElseGet(() -> {
                    log.warn("Invoice not found with ID: {}", id);
                    return ResponseEntity.notFound().build();
                });
    }

    @GetMapping("/invoice-id/{invoiceId}")
    public ResponseEntity<?> getInvoiceByInvoiceId(@PathVariable String invoiceId) {
        return invoiceService.getInvoiceByInvoiceId(invoiceId)
                .map(invoice -> {
                    log.info("Retrieved invoice by invoice ID: {}", invoiceId);
                    return ResponseEntity.ok(invoice);
                })
                .orElseGet(() -> {
                    log.warn("Invoice not found with invoice ID: {}", invoiceId);
                    return ResponseEntity.notFound().build();
                });
    }

    @DeleteMapping("/{invoiceId}")
    public ResponseEntity<?> softDeleteInvoice(@PathVariable String invoiceId) {
        try {
            log.info("Soft delete requested for invoice: {}", invoiceId);

            // Check if invoice exists first
            if (!invoiceService.invoiceExists(invoiceId)) {
                log.warn("Invoice not found for deletion: {}", invoiceId);
                return ResponseEntity.notFound().build();
            }

            // Check if invoice is already deleted
            if (invoiceService.isInvoiceDeleted(invoiceId)) {
                log.warn("Invoice already deleted: {}", invoiceId);
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Invoice is already deleted");
            }

            // Perform soft delete
            boolean deleted = invoiceService.softDeleteInvoice(invoiceId);

            if (deleted) {
                log.info("Invoice soft deleted successfully: {}", invoiceId);
                return ResponseEntity.ok().body("Invoice deleted successfully");
            } else {
                log.error("Failed to soft delete invoice: {}", invoiceId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Failed to delete invoice");
            }

        } catch (IllegalStateException e) {
            log.warn("Cannot delete invoice due to business constraints: {} - {}", invoiceId, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Cannot delete invoice: " + e.getMessage());
        } catch (SecurityException e) {
            log.warn("Access denied for invoice deletion: {} - {}", invoiceId, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access denied: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error during soft delete of invoice {}: {}", invoiceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting invoice: " + e.getMessage());
        }
    }

    @GetMapping("/download/{invoiceId}")
    public ResponseEntity<ByteArrayResource> downloadInvoicePDF(@PathVariable String invoiceId) {
        try {
            log.info("PDF download requested for invoice: {}", invoiceId);
            ByteArrayResource resource = invoiceService.downloadInvoicePDF(invoiceId);
            log.info("PDF download successful for invoice: {}", invoiceId);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + invoiceId + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(resource);
        } catch (Exception e) {
            log.error("Error downloading PDF for invoice {}: {}", invoiceId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/download-attachment/{invoiceId}/{attachmentNumber}")
    public ResponseEntity<ByteArrayResource> downloadAttachment(
            @PathVariable String invoiceId,
            @PathVariable int attachmentNumber) {
        try {
            if (attachmentNumber < 1 || attachmentNumber > 4) {
                log.warn("Invalid attachment number requested: {} for invoice: {}", attachmentNumber, invoiceId);
                return ResponseEntity.badRequest().build();
            }

            log.info("Attachment download requested - Invoice: {}, Attachment: {}", invoiceId, attachmentNumber);

            ByteArrayResource resource = invoiceService.downloadAttachment(invoiceId, attachmentNumber);
            String fileName = invoiceService.getAttachmentFileName(invoiceId, attachmentNumber);
            String contentType = invoiceService.getAttachmentContentType(invoiceId, attachmentNumber);

            log.info("Attachment download successful - File: {}, Type: {}", fileName, contentType);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource);
        } catch (Exception e) {
            log.error("Error downloading attachment {} for invoice {}: {}", attachmentNumber, invoiceId,
                    e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<InvoiceResponseDTO>> searchInvoicesByCustomer(@RequestParam String customerName) {
        log.info("Search requested for customer: {}", customerName);
        List<InvoiceResponseDTO> invoices = invoiceService.searchInvoicesByCustomer(customerName);
        log.info("Search completed - Found {} invoices for customer: {}", invoices.size(), customerName);
        return ResponseEntity.ok(invoices);
    }

}