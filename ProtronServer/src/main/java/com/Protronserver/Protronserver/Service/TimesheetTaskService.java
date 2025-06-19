package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.TimesheetTaskRequestDTO;
import com.Protronserver.Protronserver.Entities.*;
import com.Protronserver.Protronserver.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

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

    public int calculateTotalHours(Date startDate, Date endDate) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (!(principal instanceof User user)) {
            throw new RuntimeException("Invalid user session");
        }

        return timesheetTaskRepository.findByDateBetweenAndUser(startDate, endDate, user)
                .stream()
                .mapToInt(TimesheetTask::getHoursSpent)
                .sum();
    }

    public TimesheetTask updateTask(Long taskId, TimesheetTaskRequestDTO dto) {
        TimesheetTask task = timesheetTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setTaskType(dto.getTaskType());
        task.setDescription(dto.getDescription());
        task.setHoursSpent(dto.getHoursSpent());
        task.setDate(dto.getDate());

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
}
