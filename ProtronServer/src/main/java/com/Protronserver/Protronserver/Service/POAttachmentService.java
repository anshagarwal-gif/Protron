package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.Entities.POAttachments;
import com.Protronserver.Protronserver.DTOs.AttachmentMetaDTO;
import com.Protronserver.Protronserver.Repository.POAttachmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class POAttachmentService {

    @Autowired
    private POAttachmentRepository attachmentRepo;

    // Save attachment
    public POAttachments saveAttachment(MultipartFile file, String level, Long referenceId, String referenceNumber) throws Exception {
        POAttachments attachment = new POAttachments();
        attachment.setFileName(file.getOriginalFilename());
        attachment.setContentType(file.getContentType());
        attachment.setData(file.getBytes());

        attachment.setLevel(level);
        attachment.setReferenceId(referenceId);
        attachment.setReferenceNumber(referenceNumber);

        attachment.setUploadedAt(new Date());

        return attachmentRepo.save(attachment);
    }

    // Delete by ID
    public void deleteAttachment(Long id) {
        attachmentRepo.deleteById(id);
    }

    // Fetch full data by ID (for download)
    public Optional<POAttachments> getAttachmentById(Long id) {
        return attachmentRepo.findById(id);
    }

    // Fetch all metadata (ID + fileName)
    public List<Object> getAllAttachmentMeta() {
        return attachmentRepo.findAllAttachmentMeta();
    }

    // Fetch metadata by level and referenceId
    public List<Object> getAttachmentMetaByLevelAndReferenceId(String level, Long referenceId) {
        return attachmentRepo.findAttachmentMetaByLevelAndReferenceId(level, referenceId);
    }
}

