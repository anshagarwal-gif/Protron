package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.Entities.UserStory;
import com.Protronserver.Protronserver.Entities.UserStoryAttachment;
import com.Protronserver.Protronserver.ResultDTOs.UserStoryDto;
import com.Protronserver.Protronserver.Service.UserStoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/userstory")
public class UserStoryController {

    @Autowired
    private UserStoryService userStoryService;

    // ------------------------
    // 🔹 Create a new story
    // ------------------------
    @PostMapping
    public ResponseEntity<UserStory> createUserStory(@RequestBody UserStoryDto storyDto) {
        return ResponseEntity.ok(userStoryService.createUserStory(storyDto));
    }

    // ------------------------
    // 🔹 Update an existing story (by usId)
    // ------------------------
    @PutMapping("/{usId}")
    public ResponseEntity<UserStory> updateUserStory(
            @PathVariable String usId,
            @RequestBody UserStoryDto updatedStoryDto) {
        return ResponseEntity.ok(userStoryService.updateUserStory(usId, updatedStoryDto));
    }

    // ------------------------
    // 🔹 Soft delete a story (by usId)
    // ------------------------
    @DeleteMapping("/{usId}")
    public ResponseEntity<Void> deleteUserStory(@PathVariable String usId) {
        userStoryService.deleteUserStory(usId);
        return ResponseEntity.noContent().build();
    }

    // ------------------------
    // 🔹 Get all active stories (all tenants)
    // ------------------------
    @GetMapping("/active")
    public ResponseEntity<List<UserStory>> getAllActiveUserStories() {
        return ResponseEntity.ok(userStoryService.getActiveUserStoriesForLoggedInTenant());
    }

    // ------------------------
    // 🔹 Get single story by DB id
    // ------------------------
    @GetMapping("/active/id/{id}")
    public ResponseEntity<UserStory> getActiveStoryById(@PathVariable Long id) {
        return ResponseEntity.ok(userStoryService.getActiveUserStoryById(id));
    }

    // ------------------------
    // 🔹 Get single story by business usId
    // ------------------------
    @GetMapping("/active/usid/{usId}")
    public ResponseEntity<UserStory> getActiveStoryByUsId(@PathVariable String usId) {
        return ResponseEntity.ok(userStoryService.getActiveUserStoryByUsId(usId));
    }

    @PostMapping("/{usId}")
    public ResponseEntity<UserStoryAttachment> uploadAttachment(
            @PathVariable String usId,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(userStoryService.addAttachment(usId, file));
    }

    // 🔹 Get all attachments for a story
    @GetMapping("/{usId}")
    public ResponseEntity<List<UserStoryAttachment>> getAttachments(@PathVariable String usId) {
        return ResponseEntity.ok(userStoryService.getAttachments(usId));
    }

    // 🔹 Delete attachment by ID
    @DeleteMapping("/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long attachmentId) {
        userStoryService.deleteAttachment(attachmentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/user-stories/{parentId}")
    public ResponseEntity<List<UserStory>> getActiveUserStories(@PathVariable String parentId) {
        return ResponseEntity.ok(userStoryService.getActiveUserStoriesByParentId(parentId));
    }
}

