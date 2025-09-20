package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.Entities.SolutionStory;
import com.Protronserver.Protronserver.Entities.SolutionStoryAttachment;
import com.Protronserver.Protronserver.ResultDTOs.SolutionStoryDto;
import com.Protronserver.Protronserver.Service.SolutionStoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/solutionstory")
public class SolutionStoryController {

    private final SolutionStoryService solutionStoryService;

    @Autowired
    public SolutionStoryController(SolutionStoryService solutionStoryService) {
        this.solutionStoryService = solutionStoryService;
    }

    // --- Create ---
    @PostMapping
    public ResponseEntity<SolutionStory> createSolutionStory(@RequestBody SolutionStoryDto storyDto) {
        return ResponseEntity.ok(solutionStoryService.createSolutionStory(storyDto));
    }

    // --- Update ---
    @PutMapping("/{ssId}")
    public ResponseEntity<SolutionStory> updateSolutionStory(
            @PathVariable String ssId,
            @RequestBody SolutionStoryDto updatedDto) {
        return ResponseEntity.ok(solutionStoryService.updateSolutionStory(ssId, updatedDto));
    }

    // --- Delete (soft delete) ---
    @DeleteMapping("/{ssId}")
    public ResponseEntity<Void> deleteSolutionStory(@PathVariable String ssId) {
        solutionStoryService.deleteSolutionStory(ssId);
        return ResponseEntity.noContent().build();
    }

    // --- Get all active (all tenants) ---
    @GetMapping("/active")
    public ResponseEntity<List<SolutionStory>> getAllActiveSolutionStories() {
        return ResponseEntity.ok(solutionStoryService.getAllActiveSolutionStories());
    }

    // --- Get all active for logged-in tenant ---
    @GetMapping("/active/my-tenant")
    public ResponseEntity<List<SolutionStory>> getActiveStoriesForLoggedInTenant() {
        return ResponseEntity.ok(solutionStoryService.getActiveSolutionStoriesForLoggedInTenant());
    }

    // --- Get all active for a specific tenant ---
    @GetMapping("/active/tenant/{tenantId}")
    public ResponseEntity<List<SolutionStory>> getActiveStoriesByTenant(@PathVariable Long tenantId) {
        return ResponseEntity.ok(solutionStoryService.getAllActiveSolutionStoriesByTenant(tenantId));
    }

    // --- Get by ID ---
    @GetMapping("/active/id/{id}")
    public ResponseEntity<SolutionStory> getActiveStoryById(@PathVariable Long id) {
        return ResponseEntity.ok(solutionStoryService.getActiveSolutionStoryById(id));
    }

    // --- Get by ssId ---
    @GetMapping("/active/ssid/{ssId}")
    public ResponseEntity<SolutionStory> getActiveStoryBySsId(@PathVariable String ssId) {
        return ResponseEntity.ok(solutionStoryService.getActiveSolutionStoryBySsId(ssId));
    }

    @PostMapping("/{ssId}")
    public ResponseEntity<SolutionStoryAttachment> uploadAttachment(
            @PathVariable String ssId,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(solutionStoryService.addAttachment(ssId, file));
    }

    @GetMapping("/{ssId}")
    public ResponseEntity<List<SolutionStoryAttachment>> getAttachments(@PathVariable String ssId) {
        return ResponseEntity.ok(solutionStoryService.getAttachments(ssId));
    }

    @DeleteMapping("/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long attachmentId) {
        solutionStoryService.deleteAttachment(attachmentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/solution-stories/{parentId}")
    public ResponseEntity<List<SolutionStory>> getActiveSolutionStories(@PathVariable String parentId) {
        return ResponseEntity.ok(solutionStoryService.getActiveSolutionStoriesByParentId(parentId));
    }
}
