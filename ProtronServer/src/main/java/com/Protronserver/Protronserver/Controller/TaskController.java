package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.TaskFilterDTO;
import com.Protronserver.Protronserver.Entities.Task;
import com.Protronserver.Protronserver.Entities.TaskAttachment;
import com.Protronserver.Protronserver.ResultDTOs.TaskDto;
import com.Protronserver.Protronserver.Service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    @Autowired
    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping("/add")
    public ResponseEntity<Task> createTask(@RequestBody TaskDto taskDto) {
        return ResponseEntity.ok(taskService.createTask(taskDto));
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<Task> updateTask(@PathVariable String taskId, @RequestBody TaskDto taskDto) {
        return ResponseEntity.ok(taskService.updateTask(taskId, taskDto));
    }

    @GetMapping
    public ResponseEntity<List<Task>> getAllTasks() {
        return ResponseEntity.ok(taskService.getAllTasks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
        return taskService.getTaskById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/taskId/{taskId}")
    public ResponseEntity<Task> getTaskByTaskId(@PathVariable String taskId) {
        return taskService.getTaskByTaskId(taskId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(@PathVariable String taskId) {
        taskService.deleteTask(taskId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{taskId}/attachment")
    public ResponseEntity<TaskAttachment> uploadAttachment(
            @PathVariable String taskId,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(taskService.addAttachment(taskId, file));
    }

    // Get attachments for a task
    @GetMapping("/{taskId}/attachments")
    public ResponseEntity<List<TaskAttachment>> getAttachments(@PathVariable String taskId) {
        try {
            System.out.println("TaskController: Getting attachments for taskId: " + taskId);
            List<TaskAttachment> attachments = taskService.getAttachments(taskId);
            System.out.println(
                    "TaskController: Found " + (attachments != null ? attachments.size() : 0) + " attachments");
            return ResponseEntity.ok(attachments);
        } catch (Exception e) {
            System.err.println("TaskController: Error getting attachments: " + e.getMessage());
            e.printStackTrace();
            // Return empty list instead of error to prevent transaction rollback
            return ResponseEntity.ok(List.of());
        }
    }

    // Download attachment by its own ID
    @GetMapping("/attachment/{attachmentId}/download")
    public ResponseEntity<org.springframework.core.io.ByteArrayResource> downloadAttachment(
            @PathVariable Long attachmentId) {
        return taskService.downloadAttachment(attachmentId)
                .map(attachment -> {
                    org.springframework.core.io.ByteArrayResource resource = new org.springframework.core.io.ByteArrayResource(
                            attachment.getData());
                    return ResponseEntity.ok()
                            .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                                    "attachment; filename=\"" + attachment.getFileName() + "\"")
                            .contentType(org.springframework.http.MediaType.parseMediaType(attachment.getFileType()))
                            .body(resource);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Delete attachment
    @DeleteMapping("/attachment/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long attachmentId) {
        taskService.deleteAttachment(attachmentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/tasks/{parentId}")
    public ResponseEntity<List<Task>> getActiveTasks(@PathVariable String parentId) {
        return ResponseEntity.ok(taskService.getActiveTasksByParentId(parentId));
    }

    @PostMapping("/filter")
    public List<Task> filterTasks(@RequestBody TaskFilterDTO filter) {
        return taskService.getFilteredTasks(filter);
    }
}
