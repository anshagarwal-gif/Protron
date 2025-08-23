package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.BudgetDocumentResponse;
import com.Protronserver.Protronserver.Entities.BudgetDocument;
import com.Protronserver.Protronserver.Service.BudgetDocumentService;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST Controller for Budget Document operations
 */
@RestController
@RequestMapping("/api/budget-documents")
public class BudgetDocumentController {

    @Autowired
    private BudgetDocumentService budgetDocumentService;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    /**
     * Upload a document for a budget line
     */
    @PostMapping("/upload/{budgetId}")
    public ResponseEntity<?> uploadDocument(
            @PathVariable Integer budgetId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description) {

        try {
            String currentTenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId().toString();
            String uploadedBy = loggedInUserUtils.getLoggedInUser().getEmpCode();

            System.out.println("Current tenant ID: " + currentTenantId);

            BudgetDocument document = budgetDocumentService.uploadDocument(
                    budgetId, file, description, currentTenantId, uploadedBy);

            BudgetDocumentResponse response = convertToResponse(document);
            System.out.println("Document uploaded successfully with ID: " + response.getDocumentId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            System.err.println("IllegalArgumentException: " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            System.err.println("Exception: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error uploading document: " + e.getMessage());
        }
    }

    /**
     * Get all documents for a budget line
     */
    @GetMapping("/budget/{budgetId}")
    public ResponseEntity<?> getDocumentsByBudgetId(@PathVariable Integer budgetId) {
        try {
            String currentTenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId().toString();

            List<BudgetDocument> documents = budgetDocumentService.getDocumentsByBudgetId(budgetId);

            // Filter by tenant for security
            List<BudgetDocumentResponse> responses = documents.stream()
                    .filter(doc -> doc.getTenantId().equals(currentTenantId))
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving documents: " + e.getMessage());
        }
    }

    /**
     * Download a document
     */
    @GetMapping("/download/{documentId}")
    public ResponseEntity<?> downloadDocument(@PathVariable Integer documentId) {
        try {
            String currentTenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId().toString();

            BudgetDocument document = budgetDocumentService.getDocumentById(documentId)
                    .orElseThrow(() -> new IllegalArgumentException("Document not found"));

            // Verify tenant ownership
            if (!document.getTenantId().equals(currentTenantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
            }

            byte[] fileContent = budgetDocumentService.getFileContent(documentId, currentTenantId);

            ByteArrayResource resource = new ByteArrayResource(fileContent);

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + document.getOriginalFileName() + "\"");
            headers.add(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
            headers.add(HttpHeaders.PRAGMA, "no-cache");
            headers.add(HttpHeaders.EXPIRES, "0");

            return ResponseEntity.ok()
                    .headers(headers)
                    .contentLength(fileContent.length)
                    .contentType(MediaType.parseMediaType(document.getContentType()))
                    .body(resource);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error downloading document: " + e.getMessage());
        }
    }

    /**
     * Delete a document
     */
    @DeleteMapping("/{documentId}")
    public ResponseEntity<?> deleteDocument(@PathVariable Integer documentId) {
        try {
            String currentTenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId().toString();

            boolean deleted = budgetDocumentService.deleteDocument(documentId, currentTenantId);

            if (deleted) {
                return ResponseEntity.ok("Document deleted successfully");
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting document: " + e.getMessage());
        }
    }

    /**
     * Get document info by ID
     */
    @GetMapping("/{documentId}")
    public ResponseEntity<?> getDocumentInfo(@PathVariable Integer documentId) {
        try {
            String currentTenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId().toString();

            BudgetDocument document = budgetDocumentService.getDocumentById(documentId)
                    .orElseThrow(() -> new IllegalArgumentException("Document not found"));

            // Verify tenant ownership
            if (!document.getTenantId().equals(currentTenantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
            }

            BudgetDocumentResponse response = convertToResponse(document);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving document info: " + e.getMessage());
        }
    }

    /**
     * Convert BudgetDocument entity to response DTO
     */
    private BudgetDocumentResponse convertToResponse(BudgetDocument document) {
        return new BudgetDocumentResponse(
                document.getDocumentId(),
                document.getBudgetLine().getBudgetId(),
                document.getTenantId(),
                document.getFileName(),
                document.getOriginalFileName(),
                document.getFileSize(),
                document.getContentType(),
                document.getFilePath(),
                document.getUploadedBy(),
                document.getUploadTimestamp(),
                document.getDescription());
    }
}
