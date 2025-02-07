package com.protron.Protron.service;

import com.protron.Protron.Dto.TaskDTO;
import com.protron.Protron.entities.Task;
import com.protron.Protron.entities.Timesheet;
import com.protron.Protron.repository.TaskRepository;
import com.protron.Protron.repository.TimesheetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    TimesheetRepository timesheetRepository;

    // Create Task
    public TaskDTO createTask(TaskDTO taskDTO) {
        // Retrieve the Timesheet object using the timesheetId from the DTO
        Timesheet timesheet = timesheetRepository.findById(taskDTO.getTimesheetId())
                .orElseThrow(() -> new RuntimeException("Timesheet not found"));

        // Convert TaskDTO to Task entity
        Task task = new Task();
        task.setTaskName(taskDTO.getTaskName());
        task.setTaskDescription(taskDTO.getTaskDescription());
        task.setDuration(taskDTO.getDuration());
        task.setStartTime(taskDTO.getStartTime());
        task.setEndTime(taskDTO.getEndTime());
        task.setTimesheet(timesheet); // Set the retrieved Timesheet

        // Save the Task entity
        Task savedTask = taskRepository.save(task);

        // Return the saved task as TaskDTO
        TaskDTO savedTaskDTO = new TaskDTO();
        savedTaskDTO.setTaskId(savedTask.getTaskId());
        savedTaskDTO.setTaskName(savedTask.getTaskName());
        savedTaskDTO.setTaskDescription(savedTask.getTaskDescription());
        savedTaskDTO.setDuration(savedTask.getDuration());
        savedTaskDTO.setStartTime(savedTask.getStartTime());
        savedTaskDTO.setEndTime(savedTask.getEndTime());
        savedTaskDTO.setTimesheetId(savedTask.getTimesheet().getTimesheetId());

        return savedTaskDTO; // Return the saved TaskDTO
    }

    public TaskDTO updateTask(Long taskId, TaskDTO taskDTO) {
        // Retrieve the existing Task by its taskId
        Task existingTask = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        // Retrieve the Timesheet using the timesheetId from the TaskDTO
        Timesheet timesheet = timesheetRepository.findById(taskDTO.getTimesheetId())
                .orElseThrow(() -> new RuntimeException("Timesheet not found"));

        // Update the Task entity with the new data
        existingTask.setTaskName(taskDTO.getTaskName());
        existingTask.setTaskDescription(taskDTO.getTaskDescription());
        existingTask.setDuration(taskDTO.getDuration());
        existingTask.setStartTime(taskDTO.getStartTime());
        existingTask.setEndTime(taskDTO.getEndTime());
        existingTask.setTimesheet(timesheet); // Set the updated Timesheet

        // Save the updated Task
        Task updatedTask = taskRepository.save(existingTask);

        // Return the updated Task as TaskDTO
        TaskDTO updatedTaskDTO = new TaskDTO();
        updatedTaskDTO.setTaskId(updatedTask.getTaskId());
        updatedTaskDTO.setTaskName(updatedTask.getTaskName());
        updatedTaskDTO.setTaskDescription(updatedTask.getTaskDescription());
        updatedTaskDTO.setDuration(updatedTask.getDuration());
        updatedTaskDTO.setStartTime(updatedTask.getStartTime());
        updatedTaskDTO.setEndTime(updatedTask.getEndTime());
        updatedTaskDTO.setTimesheetId(updatedTask.getTimesheet().getTimesheetId());

        return updatedTaskDTO;
    }

    // Delete Task
    public boolean deleteTask(Long taskId) {
        Optional<Task> optionalTask = taskRepository.findById(taskId);
        if (optionalTask.isPresent()) {
            taskRepository.deleteById(taskId);
            return true;
        }
        return false; // You can throw an exception if task not found
    }

    // Get All Tasks for a Timesheet
    public List<Task> getTasksByTimesheetId(Long timesheetId) {
        return taskRepository.findByTimesheetTimesheetId(timesheetId);
    }

}
