package com.Protronserver.Protronserver.ResultDTOs;

import jakarta.persistence.Column;
import jakarta.persistence.Lob;

public class TimesheetTaskAttachmentDTO {
    private Long attachmentId;
    private String fileName;
    private String fileType;
    private Long fileSize;

    @Lob
    private byte[] fileData;


    public TimesheetTaskAttachmentDTO(Long attachmentId, String fileName, String fileType, Long fileSize, byte[] fileData) {
        this.attachmentId = attachmentId;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.fileData = fileData;
    }

    public Long getAttachmentId() {
        return attachmentId;
    }

    public void setAttachmentId(Long attachmentId) {
        this.attachmentId = attachmentId;
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

    public byte[] getFileData() {
        return fileData;
    }

    public void setFileData(byte[] fileData) {
        this.fileData = fileData;
    }
}
