package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.TaskFilterDTO;
import com.Protronserver.Protronserver.Entities.Project;
import com.Protronserver.Protronserver.Entities.Task;
import com.Protronserver.Protronserver.Entities.TaskAttachment;
import com.Protronserver.Protronserver.Repository.*;
import com.Protronserver.Protronserver.ResultDTOs.TaskDto;
import com.Protronserver.Protronserver.Utils.CustomIdGenerator;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final CustomIdGenerator idGenerator;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    @Autowired
    private TaskAttachmentRepository taskAttachmentRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserStoryRepository userStoryRepository;

    @Autowired
    private SolutionStoryRepository solutionStoryRepository;

    @Autowired
    public TaskService(TaskRepository taskRepository, CustomIdGenerator idGenerator) {
        this.taskRepository = taskRepository;
        this.idGenerator = idGenerator;
    }

    private void validateIds(TaskDto taskDto) {

        // --- Validate projectId ---
        Long projectId = taskDto.getProjectId() != null ? taskDto.getProjectId() : null;
        if (projectId == null) {
            throw new RuntimeException("Invalid projectId format");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));
        String projectCode = project.getProjectCode();

        if (!projectRepository.existsByProjectCode(projectCode)) {
            throw new RuntimeException("Project not found with code: " + projectCode);
        }

        // --- Validate parentId ---
        String parentId = taskDto.getParentId();
        if (parentId != null) {
            if (parentId.startsWith("US-")) {
                if (!userStoryRepository.existsByUsId(parentId)) {
                    throw new RuntimeException("Parent UserStory not found with usId: " + parentId);
                }
            } else if (parentId.startsWith("SS-")) {
                if (!solutionStoryRepository.existsBySsId(parentId)) {
                    throw new RuntimeException("Parent SolutionStory not found with ssId: " + parentId);
                }
            } else {
                throw new RuntimeException("Invalid parentId format. Must start with US- or SS-");
            }
        }
    }

    @Transactional
    public Task createTask(TaskDto taskDto) {

        validateIds(taskDto);

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
        return taskRepository.findByTaskIdAndEndTimestampIsNull(taskId);
    }

    @Transactional
    public Task updateTask(String taskId, TaskDto taskDto) {

        validateIds(taskDto);

        String email = loggedInUserUtils.getLoggedInUser().getEmail();

        Task oldTask = taskRepository.findByTaskIdAndEndTimestampIsNull(taskId)
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

        // Attachments are now handled in a separate call, so we don't process them
        // here.
        // if (taskDto.getAttachments() != null) {
        // for (TaskAttachment attachmentDto : taskDto.getAttachments()) {
        // attachmentDto.setTaskId(newTask.getTaskId());
        // taskAttachmentRepository.save(attachmentDto);
        // }
        // }

        return taskRepository.save(newTask);
    }

    @Transactional
    public void deleteTask(String taskId) {
        String email = loggedInUserUtils.getLoggedInUser().getEmail();

        Task task = taskRepository.findByTaskIdAndEndTimestampIsNull(taskId)
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

    public List<Task> getFilteredTasks(TaskFilterDTO filter) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Task> cq = cb.createQuery(Task.class);
        Root<Task> root = cq.from(Task.class);

        List<Predicate> predicates = new ArrayList<>();

        // Always fetch only active (not soft-deleted)
        predicates.add(cb.isNull(root.get("endTimestamp")));
        predicates.add(cb.equal(root.get("tenantId"), loggedInUserUtils.getLoggedInUser().getTenant().getTenantId()));

        if (filter.getProjectId() != null) {
            predicates.add(cb.equal(root.get("projectId"), filter.getProjectId()));
        }

        if (filter.getParentId() != null) {
            predicates.add(cb.like(root.get("parentId"), filter.getParentId() + "%"));
        }

        if (filter.getCreatedBy() != null) {
            predicates.add(cb.equal(root.get("createdBy"), filter.getCreatedBy()));
        }

        if (filter.getCreatedDate() != null) {
            LocalDate createdDate = filter.getCreatedDate().toLocalDate();
            LocalDateTime startOfDay = createdDate.atStartOfDay();
            LocalDateTime endOfDay = createdDate.atTime(LocalTime.MAX);

            predicates.add(cb.between(root.get("dateCreated"), startOfDay, endOfDay));
        }

        cq.where(predicates.toArray(new Predicate[0]));

        TypedQuery<Task> query = entityManager.createQuery(cq);
        return query.getResultList();
    }

}
