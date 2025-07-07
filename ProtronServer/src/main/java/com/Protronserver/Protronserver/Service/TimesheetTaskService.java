package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.AdminTimesheetSummaryDTO;
import com.Protronserver.Protronserver.DTOs.TimesheetTaskRequestDTO;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import com.Protronserver.Protronserver.Entities.*;
import com.Protronserver.Protronserver.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.sql.Time;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class TimesheetTaskService {

    @Autowired
    private TimesheetTaskRepository timesheetTaskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    public TimesheetTask addTask(TimesheetTaskRequestDTO dto, Long userId) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (!(principal instanceof User user)) {
            throw new RuntimeException("Invalid user session");
        }

        User targetUser = loggedInUserUtils.resolveTargetUser(userId, user);

        TimesheetTask task = new TimesheetTask();
        task.setTaskType(dto.getTaskType());
        task.setDate(dto.getDate());
        task.setHoursSpent(dto.getHoursSpent());
        task.setDescription(dto.getDescription());
        task.setAttachment(dto.getAttachment());
        task.setStartTimestamp(LocalDateTime.now());
        task.setEndTimestamp(null);
        task.setLastUpdatedBy(null);

        task.setUser(targetUser);
        task.setTenant(user.getTenant());

        Project project = projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        task.setProject(project);

        return timesheetTaskRepository.save(task);
    }

    public List<TimesheetTask> getTasksBetweenDates(Date startDate, Date endDate) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        User user;
        if (principal instanceof User u) {
            user = u;
        } else {
            throw new RuntimeException("Unauthorized access");
        }

        return timesheetTaskRepository.findByDateBetweenAndUserAndEndTimestampIsNull(startDate, endDate, user);
    }

    public List<TimesheetTask> getTasksBetweenDatesForUser(Date startDate, Date endDate, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return timesheetTaskRepository.findByDateBetweenAndUserAndEndTimestampIsNull(startDate, endDate, user);
    }

    public void copyTasksToNextWeek(Date startDate, Date endDate, Long userId) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (!(principal instanceof User user)) {
            throw new RuntimeException("Invalid user session");
        }

        User targetUser = loggedInUserUtils.resolveTargetUser(userId, user);

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

            timesheetTaskRepository.save(newTask);
        }
    }

    public double calculateTotalHours(Date startDate, Date endDate, Long userId) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (!(principal instanceof User user)) {
            throw new RuntimeException("Invalid user session");
        }

        User targetUser = loggedInUserUtils.resolveTargetUser(userId, user);

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
        // Add this line to handle attachment updates
        newTask.setAttachment(dto.getAttachment());

        Project project = projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        newTask.setProject(project);
        newTask.setStartTimestamp(LocalDateTime.now());

        User taskUser = userRepository.findById(existingTask.getUser().getUserId())
                .orElseThrow(() -> new RuntimeException("User Not found"));
        newTask.setUser(taskUser);

        newTask.setEndTimestamp(null);
        newTask.setLastUpdatedBy(null);

        return timesheetTaskRepository.save(newTask);
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

    public String submitPendingTasks(Date startDate, Date endDate, Long userId) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof User user))
            throw new RuntimeException("Invalid session");

        User targetUser = loggedInUserUtils.resolveTargetUser(userId, user);

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

}
