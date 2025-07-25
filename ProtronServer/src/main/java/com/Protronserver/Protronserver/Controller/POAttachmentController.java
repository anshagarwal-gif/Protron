package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.Entities.POAttachments;
import com.Protronserver.Protronserver.Service.POAttachmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Optional;

@RestController
@RequestMapping("/api/po-attachments")
public class POAttachmentController {

    @Autowired
    private POAttachmentService poAttachmentService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadAttachment(
            @RequestParam("poNumber") String poNumber,
            @RequestParam("entityType") String entityType,
            @RequestParam(value = "entityId", required = false) Long entityId,
            @RequestParam("attachmentSlot") String attachmentSlot,
            @RequestParam("file") MultipartFile file,
            @RequestParam("updatedBy") String updatedBy) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File cannot be empty.");
        }

        if (!entityType.equalsIgnoreCase("PO") && entityId == null) {
            return ResponseEntity.badRequest().body("entityId is required for type " + entityType);
        }

        try {
            POAttachments updatedAttachments = poAttachmentService.addOrUpdateAttachment(poNumber, entityType, entityId, attachmentSlot, file, updatedBy);
            return ResponseEntity.ok(updatedAttachments);
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Error processing file: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteAttachment(
            @RequestParam("poNumber") String poNumber,
            @RequestParam("attachmentSlot") String attachmentSlot,
            @RequestParam("updatedBy") String updatedBy) {
        try {
            POAttachments updatedAttachments = poAttachmentService.deleteAttachment(poNumber, attachmentSlot, updatedBy);
            return ResponseEntity.ok(updatedAttachments);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{poNumber}")
    public ResponseEntity<POAttachments> getAttachmentsForPO(@PathVariable String poNumber) {
        Optional<POAttachments> attachments = poAttachmentService.getAttachmentsForPO(poNumber);
        return attachments.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}

