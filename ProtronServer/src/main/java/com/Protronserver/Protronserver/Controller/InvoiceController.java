package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.Entities.Invoice;
import com.Protronserver.Protronserver.Repository.InvoiceRepository;
import com.Protronserver.Protronserver.Service.InvoiceService;
import com.Protronserver.Protronserver.DTOs.InvoiceRequestDTO;
import com.Protronserver.Protronserver.DTOs.InvoiceResponseDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final ObjectMapper objectMapper;

    @PostMapping("/generate")
    public ResponseEntity<?> generateInvoice(@Valid @RequestBody InvoiceRequestDTO requestDTO) {
        try {
            InvoiceResponseDTO response = invoiceService.createInvoice(requestDTO);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
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

            // Validate attachments
            if (attachments != null && attachments.size() > 4) {
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
            }

            InvoiceResponseDTO response;
            if (validAttachments.isEmpty()) {
                // No attachments, use regular method
                response = invoiceService.createInvoice(requestDTO);
            } else {
                // With attachments
                response = invoiceService.createInvoiceWithAttachments(requestDTO, validAttachments);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error generating invoice with attachments: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<InvoiceResponseDTO>> getAllInvoices() {
        List<InvoiceResponseDTO> invoices = invoiceService.getAllInvoices();
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInvoiceById(@PathVariable Long id) {
        return invoiceService.getInvoiceById(id)
                .map(invoice -> ResponseEntity.ok(invoice))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/invoice-id/{invoiceId}")
    public ResponseEntity<?> getInvoiceByInvoiceId(@PathVariable String invoiceId) {
        return invoiceService.getInvoiceByInvoiceId(invoiceId)
                .map(invoice -> ResponseEntity.ok(invoice))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/download/{invoiceId}")
    public ResponseEntity<ByteArrayResource> downloadInvoicePDF(@PathVariable String invoiceId) {
        try {
            ByteArrayResource resource = invoiceService.downloadInvoicePDF(invoiceId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + invoiceId + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/download-attachment/{invoiceId}/{attachmentNumber}")
    public ResponseEntity<ByteArrayResource> downloadAttachment(
            @PathVariable String invoiceId,
            @PathVariable int attachmentNumber) {
        try {
            if (attachmentNumber < 1 || attachmentNumber > 4) {
                return ResponseEntity.badRequest().build();
            }

            ByteArrayResource resource = invoiceService.downloadAttachment(invoiceId, attachmentNumber);
            String fileName = invoiceService.getAttachmentFileName(invoiceId, attachmentNumber);
            String contentType = invoiceService.getAttachmentContentType(invoiceId, attachmentNumber);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<InvoiceResponseDTO>> searchInvoicesByCustomer(@RequestParam String customerName) {
        List<InvoiceResponseDTO> invoices = invoiceService.searchInvoicesByCustomer(customerName);
        return ResponseEntity.ok(invoices);
    }
}