package com.Protronserver.Protronserver.ResultDTOs;

import java.time.LocalDateTime;

public class RidaAttachmentResultDTO {

    private Long id;
    private String fileName;
    private String contentType;
    private LocalDateTime uploadedAt;

    public RidaAttachmentResultDTO(Long id, String fileName, String contentType, LocalDateTime uploadedAt) {
        this.id = id;
        this.fileName = fileName;
        this.contentType = contentType;
        this.uploadedAt = uploadedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}
