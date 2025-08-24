package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.Entities.Release;
import com.Protronserver.Protronserver.Entities.ReleaseAttachment;
import com.Protronserver.Protronserver.Service.ReleaseService;
import com.Protronserver.Protronserver.DTOs.ReleaseAttachementDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/releases")
public class ReleaseController {

    @Autowired
    private ReleaseService releaseService;

    // --- Release CRUD ---
    @GetMapping
    public List<Release> getAllReleases() {
        return releaseService.getAllReleases();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Release> getReleaseById(@PathVariable Long id) {
        return releaseService.getReleaseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Release createRelease(@RequestBody Release release) {
        return releaseService.createRelease(release);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Release> updateRelease(@PathVariable Long id, @RequestBody Release release) {
        try {
            return ResponseEntity.ok(releaseService.editRelease(release, id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRelease(@PathVariable Long id) {
        releaseService.deleteRelease(id);
        return ResponseEntity.noContent().build();
    }

    // --- Attachments ---
    @PostMapping("/{releaseId}/attachments")
    public ResponseEntity<ReleaseAttachment> uploadAttachment(
            @PathVariable Long releaseId,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(releaseService.addAttachment(releaseId, file));
    }

    @GetMapping("/{releaseId}/attachments")
    public List<ReleaseAttachementDTO> getAttachments(@PathVariable Long releaseId) {
        return releaseService.getAttachments(releaseId);
    }

    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long attachmentId) {
        releaseService.deleteAttachment(attachmentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/project/{projectId}")
    public List<Release> getReleasesByProjectId(@PathVariable Long projectId) {
        return releaseService.getAllReleasesByProject(projectId);
    }
}

