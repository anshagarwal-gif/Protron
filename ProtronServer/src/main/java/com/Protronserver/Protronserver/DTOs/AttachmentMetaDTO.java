package com.Protronserver.Protronserver.DTOs;

public class AttachmentMetaDTO {

    private Long id;
    private String fileName;

    public AttachmentMetaDTO(Long id, String fileName) {
        this.id = id;
        this.fileName = fileName;
    }

    public Long getId() {
        return id;
    }

    public String getFileName() {
        return fileName;
    }
}

