package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.AdminTimesheetSummaryDTO;
import com.Protronserver.Protronserver.DTOs.TimesheetTaskRequestDTO;
import com.Protronserver.Protronserver.Entities.*;
import com.Protronserver.Protronserver.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
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

    public TimesheetTask addTask(TimesheetTaskRequestDTO dto) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (!(principal instanceof User user)) {
            throw new RuntimeException("Invalid user session");
        }

        TimesheetTask task = new TimesheetTask();
        task.setTaskType(dto.getTaskType());
        task.setDate(dto.getDate());
        task.setHoursSpent(dto.getHoursSpent());
        task.setDescription(dto.getDescription());
        task.setAttachment(dto.getAttachment());

        task.setUser(user);
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

        return timesheetTaskRepository.findByDateBetweenAndUser(startDate, endDate, user);
    }

    public List<TimesheetTask> getTasksBetweenDatesForUser(Date startDate, Date endDate, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return timesheetTaskRepository.findByDateBetweenAndUser(startDate, endDate, user);
    }

    public void copyTasksToNextWeek(Date startDate, Date endDate) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (!(principal instanceof User user)) {
            throw new RuntimeException("Invalid user session");
        }

        List<TimesheetTask> lastWeekTasks = timesheetTaskRepository.findByDateBetweenAndUser(startDate, endDate, user);

        for (TimesheetTask oldTask : lastWeekTasks) {
            TimesheetTask newTask = new TimesheetTask();
            newTask.setTaskType(oldTask.getTaskType());
            newTask.setDescription(oldTask.getDescription());
            newTask.setHoursSpent(oldTask.getHoursSpent());

            // Add 7 days to each date to copy to next week
            Date newDate = new Date(oldTask.getDate().getTime() + (7 * 24 * 60 * 60 * 1000L));
            newTask.setDate(newDate);

            newTask.setUser(user);
            newTask.setTenant(user.getTenant());
            newTask.setProject(oldTask.getProject());

            timesheetTaskRepository.save(newTask);
        }
    }

    public double calculateTotalHours(Date startDate, Date endDate) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (!(principal instanceof User user)) {
            throw new RuntimeException("Invalid user session");
        }

        return timesheetTaskRepository.findByDateBetweenAndUser(startDate, endDate, user)
                .stream()
                .mapToDouble(TimesheetTask::getHoursSpent)
                .sum();
    }

    public TimesheetTask findTaskById(Long taskId) {
        return timesheetTaskRepository.findById(taskId)
                .orElse(null); // Return null instead of throwing exception for 404 handling
    }

    public TimesheetTask updateTask(Long taskId, TimesheetTaskRequestDTO dto) {
        TimesheetTask task = timesheetTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (task.isSubmitted()) {
            throw new RuntimeException("Submitted tasks cannot be edited.");
        }

        task.setTaskType(dto.getTaskType());
        task.setDescription(dto.getDescription());
        task.setHoursSpent(dto.getHoursSpent());
        task.setDate(dto.getDate());
        // Add this line to handle attachment updates
        task.setAttachment(dto.getAttachment());

        Project project = projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        task.setProject(project);

        return timesheetTaskRepository.save(task);
    }

    public void deleteTask(Long taskId) {
        if (!timesheetTaskRepository.existsById(taskId)) {
            throw new RuntimeException("Task not found");
        }
        timesheetTaskRepository.deleteById(taskId);
    }

    public String submitPendingTasks(Date startDate, Date endDate) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof User user))
            throw new RuntimeException("Invalid session");

        List<TimesheetTask> unsubmittedTasks = timesheetTaskRepository
                .findByDateBetweenAndUserAndIsSubmittedFalse(startDate, endDate, user);

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
                    .findByDateBetweenAndUserAndIsSubmittedTrue(startDate, endDate, user);

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
