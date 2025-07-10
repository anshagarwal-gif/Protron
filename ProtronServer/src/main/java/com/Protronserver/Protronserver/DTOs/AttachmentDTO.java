package com.Protronserver.Protronserver.DTOs;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AttachmentDTO {
    private byte[] fileData;
    private String fileName;
    private String fileType;
    private Long fileSize;

    // Default constructor
    public AttachmentDTO() {
    }

    // Constructor with all fields
    public AttachmentDTO(byte[] fileData, String fileName, String fileType, Long fileSize) {
        this.fileData = fileData;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
    }

    public byte[] getFileData() {
        return fileData;
    }

    public void setFileData(byte[] fileData) {
        this.fileData = fileData;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }
}
