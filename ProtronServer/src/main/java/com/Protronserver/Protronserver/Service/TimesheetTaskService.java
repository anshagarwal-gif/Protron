package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.AdminTimesheetSummaryDTO;
import com.Protronserver.Protronserver.DTOs.TimesheetTaskRequestDTO;
import com.Protronserver.Protronserver.ResultDTOs.TimesheetTaskAttachmentDTO;
import com.Protronserver.Protronserver.ResultDTOs.TimesheetTaskDTO;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import com.Protronserver.Protronserver.Entities.*;
import com.Protronserver.Protronserver.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import com.Protronserver.Protronserver.DTOs.AttachmentDTO;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Time;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class TimesheetTaskService {

    @Autowired
    private TimesheetTaskRepository timesheetTaskRepository;

    @Autowired
    private TimesheetTaskAttachmentRepository timesheetTaskAttachmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    public TimesheetTask addTask(TimesheetTaskRequestDTO dto) {

        User targetUser = loggedInUserUtils.getLoggedInUser();

        TimesheetTask task = new TimesheetTask();
        task.setTaskType(dto.getTaskType());
        task.setDate(dto.getDate());
        task.setHoursSpent(dto.getHoursSpent());
        task.setDescription(dto.getDescription());

        task.setStartTimestamp(LocalDateTime.now());
        task.setEndTimestamp(null);
        task.setLastUpdatedBy(null);

        task.setUser(targetUser);
        task.setTenant(targetUser.getTenant());

        Project project = projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        task.setProject(project);
        // Save the task first to get the ID
        TimesheetTask savedTask = timesheetTaskRepository.save(task);

        // Handle multiple attachments
        if (dto.getAttachments() != null && !dto.getAttachments().isEmpty()) {
            List<TimesheetTaskAttachment> attachments = new ArrayList<>();

            for (AttachmentDTO attachmentDTO : dto.getAttachments()) {
                if (attachmentDTO.getFileData() != null && attachmentDTO.getFileData().length > 0) {
                    TimesheetTaskAttachment attachment = new TimesheetTaskAttachment();
                    attachment.setFileData(attachmentDTO.getFileData());
                    attachment.setFileName(attachmentDTO.getFileName());
                    attachment.setFileType(attachmentDTO.getFileType());
                    attachment.setFileSize(attachmentDTO.getFileSize());
                    attachment.setTimesheetTask(savedTask);

                    attachments.add(attachment);
                }
            }

            if (!attachments.isEmpty()) {
                timesheetTaskAttachmentRepository.saveAll(attachments);
                savedTask.setAttachments(attachments);
            }
        }
        return timesheetTaskRepository.save(task);
    }

    public List<TimesheetTaskDTO> getTasksBetweenDates(Date startDate, Date endDate) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        User user;
        if (principal instanceof User u) {
            user = u;
        } else {
            throw new RuntimeException("Unauthorized access");
        }

        List<TimesheetTaskDTO> dtos = timesheetTaskRepository.findTaskDTOsBetweenDates(startDate, endDate, user.getUserId());
        for(TimesheetTaskDTO dto : dtos){
            List<TimesheetTaskAttachmentDTO> attachmentDTOS = timesheetTaskAttachmentRepository.findByTimesheetTaskId(dto.getTaskId());
            dto.setAttachments(attachmentDTOS);
        }

        return dtos;
    }

    public List<TimesheetTaskDTO> getTasksBetweenDatesForUser(Date startDate, Date endDate, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<TimesheetTaskDTO> dtos = timesheetTaskRepository.findTaskDTOsBetweenDates(startDate, endDate, user.getUserId());
        for(TimesheetTaskDTO dto : dtos){
            List<TimesheetTaskAttachmentDTO> attachmentDTOS = timesheetTaskAttachmentRepository.findByTimesheetTaskId(dto.getTaskId());
            dto.setAttachments(attachmentDTOS);
        }

        return dtos;

    }

    public void copyTasksToNextWeek(Date startDate, Date endDate) {

        User targetUser = loggedInUserUtils.getLoggedInUser();

        List<TimesheetTask> lastWeekTasks = timesheetTaskRepository
                .findByDateBetweenAndUserAndEndTimestampIsNull(startDate, endDate, targetUser);

        for (TimesheetTask oldTask : lastWeekTasks) {
            TimesheetTask newTask = new TimesheetTask();
            newTask.setTaskType(oldTask.getTaskType());
            newTask.setDescription(oldTask.getDescription());
            newTask.setHoursSpent(oldTask.getHoursSpent());

            // Add 7 days to each date to copy to next week
            Date newDate = new Date(oldTask.getDate().getTime() + (7 * 24 * 60 * 60 * 1000L));
            newTask.setDate(newDate);

            newTask.setUser(targetUser);
            newTask.setTenant(targetUser.getTenant());
            newTask.setProject(oldTask.getProject());
            newTask.setStartTimestamp(LocalDateTime.now());
            newTask.setEndTimestamp(null);
            newTask.setLastUpdatedBy(null);
            // Save the new task first
            TimesheetTask savedNewTask = timesheetTaskRepository.save(newTask);

            // Copy attachments from old task
            if (oldTask.getAttachments() != null && !oldTask.getAttachments().isEmpty()) {
                List<TimesheetTaskAttachment> newAttachments = new ArrayList<>();

                for (TimesheetTaskAttachment oldAttachment : oldTask.getAttachments()) {
                    TimesheetTaskAttachment newAttachment = new TimesheetTaskAttachment();
                    newAttachment.setFileData(oldAttachment.getFileData());
                    newAttachment.setFileName(oldAttachment.getFileName());
                    newAttachment.setFileType(oldAttachment.getFileType());
                    newAttachment.setFileSize(oldAttachment.getFileSize());
                    newAttachment.setTimesheetTask(savedNewTask);

                    newAttachments.add(newAttachment);
                }

                timesheetTaskAttachmentRepository.saveAll(newAttachments);
                savedNewTask.setAttachments(newAttachments);
            }

        }

    }

    public double calculateTotalHours(Date startDate, Date endDate) {
        User targetUser = loggedInUserUtils.getLoggedInUser();

        return timesheetTaskRepository.findByDateBetweenAndUserAndEndTimestampIsNull(startDate, endDate, targetUser)
                .stream()
                .mapToDouble(TimesheetTask::getHoursSpent)
                .sum();
    }

    public TimesheetTask findTaskById(Long taskId) {
        return timesheetTaskRepository.findById(taskId)
                .orElse(null); // Return null instead of throwing exception for 404 handling
    }

    public TimesheetTask updateTask(Long taskId, TimesheetTaskRequestDTO dto) {
        TimesheetTask existingTask = timesheetTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (existingTask.isSubmitted()) {
            throw new RuntimeException("Submitted tasks cannot be edited.");
        }

        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) {
            existingTask.setLastUpdatedBy(user.getEmail());
            existingTask.setEndTimestamp(LocalDateTime.now());
        }
        timesheetTaskRepository.save(existingTask);

        TimesheetTask newTask = new TimesheetTask();

        newTask.setTaskType(dto.getTaskType());
        newTask.setDescription(dto.getDescription());
        newTask.setHoursSpent(dto.getHoursSpent());
        newTask.setDate(dto.getDate());

        Project project = projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));
        newTask.setProject(project);
        newTask.setStartTimestamp(LocalDateTime.now());

        User taskUser = userRepository.findById(existingTask.getUser().getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        newTask.setUser(taskUser);

        newTask.setEndTimestamp(null);
        newTask.setLastUpdatedBy(null);

        // Save new task to get the ID
        TimesheetTask savedNewTask = timesheetTaskRepository.save(newTask);

        // Fetch existing attachments of old task
        List<TimesheetTaskAttachment> existingAttachments = timesheetTaskAttachmentRepository
                .findByTimesheetTaskTaskId(existingTask.getTaskId());

        // Build set of filenames user wants to keep (from DTO)
        Set<String> filenamesToRetain = new HashSet<>();
        System.out.println(dto.getAttachments() == null);
        if (dto.getAttachments() != null) {
        System.out.println(dto.getAttachments().size());
            for (AttachmentDTO dtoAttachment : dto.getAttachments()) {
        System.out.println(dtoAttachment.getFileName() == null);
        System.out.println(dtoAttachment.getFileData() == null);
                if (dtoAttachment.getFileData() == null && dtoAttachment.getFileName() != null) {
                    // Means user wants to retain an existing attachment
                    filenamesToRetain.add(dtoAttachment.getFileName());
                }
            }
        }

        List<TimesheetTaskAttachment> newAttachments = new ArrayList<>();

        // Retain only selected existing attachments
        for (TimesheetTaskAttachment existingAttachment : existingAttachments) {
            System.out.println(existingAttachment.getFileName());
            System.out.println(filenamesToRetain);
            if (filenamesToRetain.contains(existingAttachment.getFileName())) {
                TimesheetTaskAttachment retainedAttachment = new TimesheetTaskAttachment();
                retainedAttachment.setFileData(existingAttachment.getFileData());
                retainedAttachment.setFileName(existingAttachment.getFileName());
                retainedAttachment.setFileType(existingAttachment.getFileType());
                retainedAttachment.setFileSize(existingAttachment.getFileSize());
                retainedAttachment.setTimesheetTask(savedNewTask);
                newAttachments.add(retainedAttachment);
            }
        }

        // Add new attachments from DTO
        if (dto.getAttachments() != null) {
            for (AttachmentDTO attachmentDTO : dto.getAttachments()) {
                if (attachmentDTO.getFileData() != null && attachmentDTO.getFileData().length > 0) {
                    TimesheetTaskAttachment newAttachment = new TimesheetTaskAttachment();
                    newAttachment.setFileData(attachmentDTO.getFileData());
                    newAttachment.setFileName(attachmentDTO.getFileName());
                    newAttachment.setFileType(attachmentDTO.getFileType());
                    newAttachment.setFileSize(attachmentDTO.getFileSize());
                    newAttachment.setTimesheetTask(savedNewTask);
                    newAttachments.add(newAttachment);
                }
            }
        }

        // Save and associate attachments
        if (!newAttachments.isEmpty()) {
            timesheetTaskAttachmentRepository.saveAll(newAttachments);
            savedNewTask.setAttachments(newAttachments);
        }

        return savedNewTask;
    }


    public void deleteTask(Long taskId) {
        TimesheetTask existingTask = timesheetTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) {
            existingTask.setLastUpdatedBy(user.getEmail());
            existingTask.setEndTimestamp(LocalDateTime.now());
        }
        timesheetTaskRepository.save(existingTask);
    }

    public String submitPendingTasks(Date startDate, Date endDate) {
        User targetUser = loggedInUserUtils.getLoggedInUser();

        List<TimesheetTask> unsubmittedTasks = timesheetTaskRepository
                .findByDateBetweenAndUserAndIsSubmittedFalseAndEndTimestampIsNull(startDate, endDate, targetUser);

        if (unsubmittedTasks.isEmpty()) {
            return "No tasks to submit.";
        }

        for (TimesheetTask task : unsubmittedTasks) {
            task.setSubmitted(true);
        }

        timesheetTaskRepository.saveAll(unsubmittedTasks);

        return "Submitted " + unsubmittedTasks.size() + " tasks.";
    }

    public List<AdminTimesheetSummaryDTO> getTimesheetSummaryForAllUsers(Date startDate, Date endDate) {

        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof User loggedInUser))
            throw new RuntimeException("Invalid session");

        List<User> allUsers = userRepository
                .findByTenantTenantIdAndEndTimestampIsNull(loggedInUser.getTenant().getTenantId());

        List<AdminTimesheetSummaryDTO> summaryList = new ArrayList<>();

        for (User user : allUsers) {
            // ⛳ Only submitted tasks considered
            List<TimesheetTask> tasks = timesheetTaskRepository
                    .findByDateBetweenAndUserAndEndTimestampIsNull(startDate, endDate, user);

            Map<String, Double> dailyHoursMap = new TreeMap<>();
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");

            for (TimesheetTask task : tasks) {
                String dateKey = sdf.format(task.getDate());
                dailyHoursMap.put(dateKey, dailyHoursMap.getOrDefault(dateKey, 0.0) + task.getHoursSpent());
            }

            // Fill missing days
            Calendar cal = Calendar.getInstance();
            cal.setTime(startDate);
            while (!cal.getTime().after(endDate)) {
                String dateKey = sdf.format(cal.getTime());
                dailyHoursMap.putIfAbsent(dateKey, 0.0);
                cal.add(Calendar.DATE, 1);
            }

            double total = dailyHoursMap.values().stream().mapToDouble(Double::doubleValue).sum();

            AdminTimesheetSummaryDTO dto = new AdminTimesheetSummaryDTO();
            dto.setUserId(user.getUserId());
            dto.setName(user.getFirstName() + user.getLastName());
            dto.setEmail(user.getEmail());
            dto.setDailyHours(dailyHoursMap);
            dto.setTotalHours(total);

            summaryList.add(dto);
        }

        return summaryList;
    }

    public List<TimesheetTaskAttachment> getAttachmentsByTaskId(Long taskId) {
        System.out.println("Service: Getting attachments for task ID: " + taskId);

        try {
            List<TimesheetTaskAttachment> attachments = timesheetTaskAttachmentRepository
                    .findByTimesheetTaskTaskId(taskId);
            System.out.println("Service: Found " + attachments.size() + " attachments for task " + taskId);

            for (TimesheetTaskAttachment att : attachments) {
                System.out.println("Service: Attachment ID: " + att.getAttachmentId() +
                        ", fileName: " + att.getFileName());
            }

            return attachments;
        } catch (Exception e) {
            System.err.println("Service: Error getting attachments for task: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error retrieving attachments: " + e.getMessage(), e);
        }
    }

    /**
     * Get a specific attachment by ID
     */
    public TimesheetTaskAttachment getAttachmentById(Long attachmentId) {
        System.out.println("Service: Getting attachment by ID: " + attachmentId);

        try {
            Optional<TimesheetTaskAttachment> attachment = timesheetTaskAttachmentRepository.findById(attachmentId);

            if (attachment.isPresent()) {
                System.out.println("Service: Attachment found with ID: " + attachmentId);
                TimesheetTaskAttachment att = attachment.get();
                System.out.println("Service: Attachment details - fileName: " + att.getFileName() +
                        ", fileSize: " + att.getFileSize() +
                        ", fileType: " + att.getFileType());
                return att;
            } else {
                System.out.println("Service: No attachment found with ID: " + attachmentId);
                throw new RuntimeException("Attachment not found with ID: " + attachmentId);
            }
        } catch (Exception e) {
            System.err.println("Service: Error getting attachment by ID: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error retrieving attachment: " + e.getMessage(), e);
        }
    }

    /**
     * Delete a specific attachment
     */
    @Transactional
    public void deleteAttachment(Long attachmentId) {
        System.out.println("Service: Deleting attachment with ID: " + attachmentId);

        TimesheetTaskAttachment attachment = timesheetTaskAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));

        // Check if the task is submitted
        if (attachment.getTimesheetTask().isSubmitted()) {
            throw new RuntimeException("Cannot delete attachments from submitted tasks");
        }

        timesheetTaskAttachmentRepository.delete(attachment);
        System.out.println("Service: Attachment deleted successfully: " + attachmentId);
    }

    /**
     * Count attachments for a specific task
     */
    public long countAttachmentsByTaskId(Long taskId) {
        return timesheetTaskAttachmentRepository.countByTimesheetTaskTaskId(taskId);
    }
}
