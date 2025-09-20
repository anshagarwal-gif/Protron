package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.Entities.Task;
import com.Protronserver.Protronserver.Entities.TaskAttachment;
import com.Protronserver.Protronserver.Repository.TaskAttachmentRepository;
import com.Protronserver.Protronserver.Repository.TaskRepository;
import com.Protronserver.Protronserver.ResultDTOs.TaskDto;
import com.Protronserver.Protronserver.Utils.CustomIdGenerator;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final CustomIdGenerator idGenerator;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    @Autowired
    private TaskAttachmentRepository taskAttachmentRepository;

    @Autowired
    public TaskService(TaskRepository taskRepository, CustomIdGenerator idGenerator) {
        this.taskRepository = taskRepository;
        this.idGenerator = idGenerator;
    }

    @Transactional
    public Task createTask(TaskDto taskDto) {
        Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
        String email = loggedInUserUtils.getLoggedInUser().getEmail();

        Task task = new Task();
        long sequence = taskRepository.count() + 1; // simple sequence for taskId
        task.setTaskId(idGenerator.generate("TASK", sequence));
        task.setTenantId(tenantId);
        task.setProjectId(taskDto.getProjectId());
        task.setParentId(taskDto.getParentId());
        task.setDate(taskDto.getDate());
        task.setTaskType(taskDto.getTaskType());
        task.setTaskTopic(taskDto.getTaskTopic());
        task.setTaskDescription(taskDto.getTaskDescription());
        task.setEstTime(taskDto.getEstTime());
        task.setTimeSpentHours(taskDto.getTimeSpentHours());
        task.setTimeSpentMinutes(taskDto.getTimeSpentMinutes());
        task.setTimeRemainingHours(taskDto.getTimeRemainingHours());
        task.setTimeRemainingMinutes(taskDto.getTimeRemainingMinutes());
        task.setCreatedBy(email);
        task.setDateCreated(LocalDateTime.now());
        task.setStartTimestamp(LocalDateTime.now());
        task.setEndTimestamp(null);
        task.setLastUpdatedBy(null);

        return taskRepository.save(task);
    }

    @Transactional(readOnly = true)
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Task> getTaskById(Long id) {
        return taskRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Task> getTaskByTaskId(String taskId) {
        return taskRepository.findByTaskId(taskId);
    }

    @Transactional
    public Task updateTask(String taskId, TaskDto taskDto) {
        String email = loggedInUserUtils.getLoggedInUser().getEmail();

        Task oldTask = taskRepository.findByTaskId(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found with taskId: " + taskId));

        // Soft-delete old task
        oldTask.setEndTimestamp(LocalDateTime.now());
        oldTask.setLastUpdatedBy(email);
        taskRepository.save(oldTask);

        // Create new version
        Task newTask = new Task();
        newTask.setTaskId(oldTask.getTaskId());
        newTask.setTenantId(oldTask.getTenantId());
        newTask.setProjectId(taskDto.getProjectId());
        newTask.setParentId(taskDto.getParentId());
        newTask.setDate(taskDto.getDate());
        newTask.setTaskType(taskDto.getTaskType());
        newTask.setTaskTopic(taskDto.getTaskTopic());
        newTask.setTaskDescription(taskDto.getTaskDescription());
        newTask.setEstTime(taskDto.getEstTime());
        newTask.setTimeSpentHours(taskDto.getTimeSpentHours());
        newTask.setTimeSpentMinutes(taskDto.getTimeSpentMinutes());
        newTask.setTimeRemainingHours(taskDto.getTimeRemainingHours());
        newTask.setTimeRemainingMinutes(taskDto.getTimeRemainingMinutes());
        newTask.setCreatedBy(oldTask.getCreatedBy());
        newTask.setDateCreated(oldTask.getDateCreated());
        newTask.setStartTimestamp(LocalDateTime.now());
        newTask.setEndTimestamp(null);
        newTask.setLastUpdatedBy(null);

        return taskRepository.save(newTask);
    }

    @Transactional
    public void deleteTask(String taskId) {
        String email = loggedInUserUtils.getLoggedInUser().getEmail();

        Task task = taskRepository.findByTaskId(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found with taskId: " + taskId));

        task.setEndTimestamp(LocalDateTime.now());
        task.setLastUpdatedBy(email);
        taskRepository.save(task);
    }

    @Transactional
    public TaskAttachment addAttachment(String taskId, MultipartFile file) throws IOException {
        TaskAttachment attachment = new TaskAttachment();
        attachment.setTaskId(taskId);
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFileType(file.getContentType());
        attachment.setFileSize(file.getSize());
        attachment.setData(file.getBytes());
        attachment.setUploadedAt(LocalDateTime.now());
        return taskAttachmentRepository.save(attachment);
    }

    @Transactional(readOnly = true)
    public List<TaskAttachment> getAttachments(String taskId) {
        return taskAttachmentRepository.findByTaskId(taskId);
    }

    @Transactional
    public void deleteAttachment(Long attachmentId) {
        taskAttachmentRepository.deleteById(attachmentId);
    }

    @Transactional(readOnly = true)
    public List<Task> getActiveTasksByParentId(String parentId) {
        Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
        return taskRepository.findByTenantIdAndParentIdAndEndTimestampIsNull(tenantId, parentId);
    }

}
