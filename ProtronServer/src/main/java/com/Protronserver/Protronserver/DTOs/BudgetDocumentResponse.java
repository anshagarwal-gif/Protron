package com.Protronserver.Protronserver.DTOs;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

/**
 * Response DTO for Budget Document operations
 */
public class BudgetDocumentResponse {

    private Integer documentId;
    private Integer budgetId;
    private String tenantId;
    private String fileName;
    private String originalFileName;
    private Long fileSize;
    private String contentType;
    private String filePath;
    private String uploadedBy;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime uploadTimestamp;

    private String description;

    // Default constructor
    public BudgetDocumentResponse() {
    }

    // Constructor with parameters
    public BudgetDocumentResponse(Integer documentId, Integer budgetId, String tenantId,
            String fileName, String originalFileName, Long fileSize,
            String contentType, String filePath, String uploadedBy,
            LocalDateTime uploadTimestamp, String description) {
        this.documentId = documentId;
        this.budgetId = budgetId;
        this.tenantId = tenantId;
        this.fileName = fileName;
        this.originalFileName = originalFileName;
        this.fileSize = fileSize;
        this.contentType = contentType;
        this.filePath = filePath;
        this.uploadedBy = uploadedBy;
        this.uploadTimestamp = uploadTimestamp;
        this.description = description;
    }

    // Getters and Setters
    public Integer getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Integer documentId) {
        this.documentId = documentId;
    }

    public Integer getBudgetId() {
        return budgetId;
    }

    public void setBudgetId(Integer budgetId) {
        this.budgetId = budgetId;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(String uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public LocalDateTime getUploadTimestamp() {
        return uploadTimestamp;
    }

    public void setUploadTimestamp(LocalDateTime uploadTimestamp) {
        this.uploadTimestamp = uploadTimestamp;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
