package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity class for budget_line_documents table
 */
@Entity
@Table(name = "budget_line_documents")
public class BudgetDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "document_id")
    private Integer documentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "budget_id", nullable = false)
    private BudgetLine budgetLine;

    @Column(name = "tenant_id", length = 50, nullable = false)
    private String tenantId;

    @Column(name = "file_name", length = 255, nullable = false)
    private String fileName;

    @Column(name = "original_file_name", length = 255, nullable = false)
    private String originalFileName;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "content_type", length = 100, nullable = false)
    private String contentType;

    @Column(name = "file_path", length = 500, nullable = false)
    private String filePath;

    @Column(name = "uploaded_by", length = 100, nullable = false)
    private String uploadedBy;

    @Column(name = "upload_timestamp", nullable = false)
    private LocalDateTime uploadTimestamp;

    @Column(name = "description", length = 500)
    private String description;

    // Default constructor
    public BudgetDocument() {
    }

    // Constructor with parameters
    public BudgetDocument(BudgetLine budgetLine, String tenantId, String fileName,
            String originalFileName, Long fileSize, String contentType,
            String filePath, String uploadedBy, String description) {
        this.budgetLine = budgetLine;
        this.tenantId = tenantId;
        this.fileName = fileName;
        this.originalFileName = originalFileName;
        this.fileSize = fileSize;
        this.contentType = contentType;
        this.filePath = filePath;
        this.uploadedBy = uploadedBy;
        this.description = description;
        this.uploadTimestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public Integer getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Integer documentId) {
        this.documentId = documentId;
    }

    public BudgetLine getBudgetLine() {
        return budgetLine;
    }

    public void setBudgetLine(BudgetLine budgetLine) {
        this.budgetLine = budgetLine;
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
