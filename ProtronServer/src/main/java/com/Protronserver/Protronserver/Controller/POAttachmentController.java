package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.Entities.POAttachments;
import com.Protronserver.Protronserver.Service.POAttachmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/po-attachments")
public class POAttachmentController {

    @Autowired
    private POAttachmentService poAttachmentService;

    @PostMapping("/upload")
    public ResponseEntity<String> uploadAttachment(
            @RequestParam("file") MultipartFile file,
            @RequestParam("level") String level,
            @RequestParam("referenceId") Long referenceId,
            @RequestParam(value = "referenceNumber", required = false) String referenceNumber
    ) {
        try {
            poAttachmentService.saveAttachment(file, level, referenceId, referenceNumber);
            return ResponseEntity.ok("File uploaded successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Upload failed: " + e.getMessage());
        }
    }

    // 📄 Get metadata (all attachments)
    @GetMapping("/meta")
    public ResponseEntity<List<Object>> getAllAttachmentMetadata() {
        return ResponseEntity.ok(poAttachmentService.getAllAttachmentMeta());
    }

    // 📄 Get metadata for specific level and referenceId
    @GetMapping("/meta/filter")
    public ResponseEntity<List<Object>> getAttachmentMetaByLevelAndReference(
            @RequestParam("level") String level,
            @RequestParam("referenceId") Long referenceId
    ) {
        return ResponseEntity.ok(poAttachmentService.getAttachmentMetaByLevelAndReferenceId(level, referenceId));
    }

    // 📤 Download file by ID
    @GetMapping("/{id}/download")
    public ResponseEntity<ByteArrayResource> downloadAttachment(@PathVariable Long id) {
        return poAttachmentService.getAttachmentById(id)
                .map(attachment -> {
                    ByteArrayResource resource = new ByteArrayResource(attachment.getData());
                    return ResponseEntity.ok()
                            .contentType(MediaType.parseMediaType(attachment.getContentType()))
                            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
                            .body(resource);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ❌ Delete an attachment by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteAttachment(@PathVariable Long id) {
        try {
            poAttachmentService.deleteAttachment(id);
            return ResponseEntity.ok("Attachment deleted successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete attachment.");
        }
    }
}

