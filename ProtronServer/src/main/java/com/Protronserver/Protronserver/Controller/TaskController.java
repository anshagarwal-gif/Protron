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
        return ResponseEntity.ok(taskService.getAttachments(taskId));
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
