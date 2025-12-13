package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.Entities.Sprint;
import com.Protronserver.Protronserver.Service.SprintService;
import com.Protronserver.Protronserver.Entities.SprintAttachment;
import com.Protronserver.Protronserver.DTOs.SprintAttachmentDTO;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sprints")
public class SprintController {

    @Autowired
    private SprintService sprintService;

    @GetMapping
    public List<Sprint> getAllSprints() {
        return sprintService.getAllSprints();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Sprint> getSprintById(@PathVariable Long id) {
        return sprintService.getSprintById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Sprint createSprint(@RequestBody Sprint sprint) {
        return sprintService.createSprint(sprint);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Sprint> updateSprint(@PathVariable Long id, @RequestBody Sprint sprint) {
        try {
            return ResponseEntity.ok(sprintService.updateSprint(id, sprint));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSprint(@PathVariable Long id) {
        sprintService.deleteSprint(id);
        return ResponseEntity.noContent().build();
    }
    // --- Attachments ---
    @PostMapping("/{sprintId}/attachments")
    public ResponseEntity<SprintAttachment> uploadAttachment(
            @PathVariable Long sprintId,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(sprintService.addAttachment(sprintId, file));
    }

    @GetMapping("/{sprintId}/attachments")
    public List<SprintAttachmentDTO> getAttachments(@PathVariable Long sprintId) {
        return sprintService.getAttachments(sprintId);
    }

    @GetMapping("/attachments/{attachmentId}/download")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable Long attachmentId) {
        SprintAttachment attachment = sprintService.getAttachment(attachmentId);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + attachment.getFileName() + "\"")
                .body(attachment.getData());
    }

    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long attachmentId) {
        sprintService.deleteAttachment(attachmentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/project/{projectId}")
    public List<Sprint> getSprintsByProjectId(@PathVariable Long projectId) {
        return sprintService.getSprintsByProjectId(projectId);
    }

    // ✅ Bulk update project for Sprint attachments
    @PutMapping("/attachments/update-project/{projectId}")
    public ResponseEntity<Void> updateProjectForAttachments(
            @PathVariable Long projectId,
            @RequestBody List<Long> attachmentIds
    ) {
        sprintService.updateProjectForAttachments(attachmentIds, projectId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{targetSprintId}/attachments/copy")
    public ResponseEntity<Void> copyAttachments(
            @PathVariable Long targetSprintId,
            @RequestBody List<Long> sourceAttachmentIds
    ) {
        sprintService.copyAttachments(sourceAttachmentIds, targetSprintId);
        return ResponseEntity.ok().build();
    }

}


