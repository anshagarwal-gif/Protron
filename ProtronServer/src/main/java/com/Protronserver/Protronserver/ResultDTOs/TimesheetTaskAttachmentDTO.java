package com.Protronserver.Protronserver.ResultDTOs;

import jakarta.persistence.Column;
import jakarta.persistence.Lob;

public class TimesheetTaskAttachmentDTO {
    private Long attachmentId;
    private String fileName;


    public TimesheetTaskAttachmentDTO(Long attachmentId, String fileName) {
        this.attachmentId = attachmentId;
        this.fileName = fileName;
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
}
