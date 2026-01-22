package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.Entities.BudgetDocument;
import com.Protronserver.Protronserver.Entities.BudgetLine;
import com.Protronserver.Protronserver.Repository.BudgetDocumentRepository;
import com.Protronserver.Protronserver.Repository.BudgetLineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class BudgetDocumentService {

    @Autowired
    private BudgetDocumentRepository budgetDocumentRepository;

    @Autowired
    private BudgetLineRepository budgetLineRepository;

    @Value("${app.upload.dir:${user.home}/uploads}")
    private String uploadDir;

    private static final int MAX_DOCUMENTS_PER_BUDGET = 4;
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final String[] ALLOWED_EXTENSIONS = {
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".jpg", ".jpeg", ".png"
    };

    /**
     * Upload a document for a budget line
     */
    public BudgetDocument uploadDocument(Integer budgetId, MultipartFile file, String description,
            String tenantId, String uploadedBy) throws Exception {

        System.out.println("=== Document Upload Debug ===");
        System.out.println("Budget ID: " + budgetId);
        System.out.println("File name: " + file.getOriginalFilename());
        System.out.println("File size: " + file.getSize());
        System.out.println("Tenant ID: " + tenantId);
        System.out.println("Uploaded by: " + uploadedBy);
        System.out.println("Upload dir: " + uploadDir);

        // Validate budget line exists
        Optional<BudgetLine> budgetLineOpt = budgetLineRepository.findById(budgetId);
        if (!budgetLineOpt.isPresent()) {
            System.out.println("ERROR: Budget line not found with ID: " + budgetId);
            throw new IllegalArgumentException("Budget line not found");
        }
        System.out.println("Budget line found: " + budgetLineOpt.get().getBudgetName());

        // Check document limit
        long currentDocumentCount = budgetDocumentRepository.countByBudgetLine_BudgetId(budgetId);
        System.out.println("Current document count: " + currentDocumentCount);
        if (currentDocumentCount >= MAX_DOCUMENTS_PER_BUDGET) {
            throw new IllegalArgumentException(
                    "Maximum " + MAX_DOCUMENTS_PER_BUDGET + " documents allowed per budget line");
        }

        // Validate file
        validateFile(file);
        System.out.println("File validation passed");

        // Create upload directory if it doesn't exist
        String budgetUploadDir = uploadDir + File.separator + "budgets" + File.separator + budgetId;
        Path uploadPath = Paths.get(budgetUploadDir);
        System.out.println("Upload path: " + uploadPath);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
            System.out.println("Created upload directory: " + uploadPath);
        }

        // Generate unique filename
        String originalFileName = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFileName);
        String uniqueFileName = UUID.randomUUID().toString() + fileExtension;
        String filePath = budgetUploadDir + File.separator + uniqueFileName;
        System.out.println("File path: " + filePath);

        // Save file to disk
        try {
            Files.copy(file.getInputStream(), Paths.get(filePath), StandardCopyOption.REPLACE_EXISTING);
            System.out.println("File saved to disk successfully");
        } catch (IOException e) {
            System.err.println("ERROR: Failed to save file: " + e.getMessage());
            throw new RuntimeException("Failed to save file", e);
        }

        // Create document entity
        BudgetDocument document = new BudgetDocument();
        document.setBudgetLine(budgetLineOpt.get());
        document.setTenantId(tenantId);
        document.setFileName(uniqueFileName);
        document.setOriginalFileName(originalFileName);
        document.setFileSize(file.getSize());
        document.setContentType(file.getContentType());
        document.setFilePath(filePath);
        document.setUploadedBy(uploadedBy);
        document.setDescription(description);
        document.setUploadTimestamp(LocalDateTime.now());

        System.out.println("Document entity created, saving to database...");
        BudgetDocument savedDocument = budgetDocumentRepository.save(document);
        System.out.println("Document saved to database with ID: " + savedDocument.getDocumentId());
        System.out.println("=== Document Upload Complete ===");

        return savedDocument;
    }

    /**
     * Get all documents for a budget line
     */
    public List<BudgetDocument> getDocumentsByBudgetId(Integer budgetId) {
        return budgetDocumentRepository.findByBudgetLine_BudgetId(budgetId);
    }

    /**
     * Get document by ID
     */
    public Optional<BudgetDocument> getDocumentById(Integer documentId) {
        return budgetDocumentRepository.findById(documentId);
    }

    /**
     * Delete document by ID
     */
    public boolean deleteDocument(Integer documentId, String tenantId) throws Exception {
        Optional<BudgetDocument> documentOpt = budgetDocumentRepository.findById(documentId);
        if (!documentOpt.isPresent()) {
            return false;
        }

        BudgetDocument document = documentOpt.get();

        // Verify tenant ownership
        if (!document.getTenantId().equals(tenantId)) {
            throw new SecurityException("Access denied");
        }

        // Delete file from disk
        try {
            Files.deleteIfExists(Paths.get(document.getFilePath()));
        } catch (IOException e) {
            // Log error but continue with database deletion
            System.err.println("Failed to delete file: " + document.getFilePath());
        }

        // Delete from database
        budgetDocumentRepository.delete(document);
        return true;
    }

    /**
     * Delete all documents for a budget line (when budget line is deleted)
     */
    public void deleteDocumentsByBudgetId(Integer budgetId) throws Exception {
        List<BudgetDocument> documents = budgetDocumentRepository.findByBudgetLine_BudgetId(budgetId);

        for (BudgetDocument document : documents) {
            try {
                Files.deleteIfExists(Paths.get(document.getFilePath()));
            } catch (IOException e) {
                System.err.println("Failed to delete file: " + document.getFilePath());
            }
        }

        budgetDocumentRepository.deleteByBudgetLine_BudgetId(budgetId);
    }

    /**
     * Validate uploaded file
     */
    private void validateFile(MultipartFile file) throws Exception {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "File size exceeds maximum limit of " + (MAX_FILE_SIZE / 1024 / 1024) + "MB");
        }

        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || originalFileName.trim().isEmpty()) {
            throw new IllegalArgumentException("Invalid filename");
        }

        String fileExtension = getFileExtension(originalFileName).toLowerCase();
        boolean isValidExtension = false;
        for (String allowedExt : ALLOWED_EXTENSIONS) {
            if (allowedExt.equals(fileExtension)) {
                isValidExtension = true;
                break;
            }
        }

        if (!isValidExtension) {
            throw new IllegalArgumentException(
                    "File type not allowed. Allowed types: " + String.join(", ", ALLOWED_EXTENSIONS));
        }
    }

    /**
     * Get file extension from filename
     */
    private String getFileExtension(String fileName) {
        int lastDotIndex = fileName.lastIndexOf('.');
        return lastDotIndex > 0 ? fileName.substring(lastDotIndex) : "";
    }

    /**
     * Migrate documents from old budget line to new budget line
     */
    public void migrateDocuments(Integer oldBudgetId, Integer newBudgetId) throws Exception {
        List<BudgetDocument> oldDocuments = budgetDocumentRepository.findByBudgetLine_BudgetId(oldBudgetId);
        
        if (oldDocuments.isEmpty()) {
            return; // No documents to migrate
        }
        
        // Get new budget line
        Optional<BudgetLine> newBudgetLineOpt = budgetLineRepository.findById(newBudgetId);
        if (!newBudgetLineOpt.isPresent()) {
            throw new IllegalArgumentException("New budget line not found with ID: " + newBudgetId);
        }
        
        BudgetLine newBudgetLine = newBudgetLineOpt.get();
        
        // Migrate each document to the new budget line
        for (BudgetDocument document : oldDocuments) {
            document.setBudgetLine(newBudgetLine);
            budgetDocumentRepository.save(document);
        }
    }

    /**
     * Get file content for download
     */
    public byte[] getFileContent(Integer documentId, String tenantId) throws Exception {
        Optional<BudgetDocument> documentOpt = budgetDocumentRepository.findById(documentId);
        if (!documentOpt.isPresent()) {
            throw new IllegalArgumentException("Document not found");
        }

        BudgetDocument document = documentOpt.get();

        // Verify tenant ownership
        if (!document.getTenantId().equals(tenantId)) {
            throw new SecurityException("Access denied");
        }

        try {
            return Files.readAllBytes(Paths.get(document.getFilePath()));
        } catch (IOException e) {
            throw new RuntimeException("Failed to read file", e);
        }
    }
}
