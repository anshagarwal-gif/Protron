package com.protron.Protron.service;

import com.protron.Protron.Dto.TaskDTO;
import com.protron.Protron.Dto.TimesheetDTO;
import com.protron.Protron.entities.Employee;
import com.protron.Protron.entities.Task;
import com.protron.Protron.entities.Timesheet;
import com.protron.Protron.repository.EmployeeRepository;
import com.protron.Protron.repository.TaskRepository;
import com.protron.Protron.repository.TimesheetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class TimesheetService {

    @Autowired
    private TimesheetRepository timesheetRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private TaskRepository taskRepository;

    public void updateTimesheetStatus(Long timesheetId, String status){
        Timesheet timesheet = timesheetRepository.findById(timesheetId)
                .orElseThrow(() -> new RuntimeException("Timesheet not found"));
        timesheet.setStatus(status);
        timesheetRepository.save(timesheet);
    }

    /**
     * Create a new timesheet with tasks.
     */
    public Timesheet saveTimesheet(TimesheetDTO timesheetDTO) {
        Optional<Employee> employeeOpt = employeeRepository.findById(timesheetDTO.getEmployeeId());
        if (employeeOpt.isEmpty()) {
            throw new RuntimeException("Employee not found!");
        }

        Timesheet timesheet = new Timesheet();
        timesheet.setEmployee(employeeOpt.get());
        timesheet.setDate(timesheetDTO.getDate());
        timesheet.setTaskDuration(timesheetDTO.getTaskDuration());
        timesheet.setStatus(timesheetDTO.getStatus());

        Timesheet savedTimesheet = timesheetRepository.save(timesheet);

        List<Task> tasks = new ArrayList<>();
        for (TaskDTO taskDTO : timesheetDTO.getTasks()) {
            Task task = new Task();
            task.setTaskName(taskDTO.getTaskName());
            task.setTaskDescription(taskDTO.getTaskDescription());
            task.setDuration(taskDTO.getDuration());
            task.setStartTime(taskDTO.getStartTime());
            task.setEndTime(taskDTO.getEndTime());
            task.setTimesheet(savedTimesheet);
            tasks.add(task);
        }

        taskRepository.saveAll(tasks);
        return savedTimesheet;
    }

    /**
     * Get all timesheets for an employee.
     */
    public List<TimesheetDTO> getTimesheetsForEmployee(Long employeeId) {
        List<Timesheet> timesheets = timesheetRepository.findByEmployeeEmployeeId(employeeId);
        List<TimesheetDTO> timesheetDTOs = new ArrayList<>();

        for (Timesheet timesheet : timesheets) {
            TimesheetDTO dto = new TimesheetDTO();
            dto.setTimesheetId(timesheet.getTimesheetId());
            dto.setEmployeeId(timesheet.getEmployee().getEmployeeId());
            dto.setDate(timesheet.getDate());
            dto.setTaskDuration(timesheet.getTaskDuration());
            dto.setStatus(timesheet.getStatus());

            List<TaskDTO> taskDTOs = new ArrayList<>();
            for (Task task : timesheet.getTasks()) {
                TaskDTO taskDTO = new TaskDTO();
                taskDTO.setTaskId(task.getTaskId());
                taskDTO.setTaskName(task.getTaskName());
                taskDTO.setTaskDescription(task.getTaskDescription());
                taskDTO.setDuration(task.getDuration());
                taskDTO.setStartTime(task.getStartTime());
                taskDTO.setEndTime(task.getEndTime());
                taskDTOs.add(taskDTO);
            }

            dto.setTasks(taskDTOs);
            timesheetDTOs.add(dto);
        }
        return timesheetDTOs;
    }


    /**
     * Get all timesheets pending approval.
     */
    public List<Timesheet> getPendingTimesheets() {
        return timesheetRepository.findByStatus("Pending");
    }

    /**
     * Delete a timesheet.
     */
    public void deleteTimesheet(Long timesheetId) {
        if (timesheetRepository.existsById(timesheetId)) {
            timesheetRepository.deleteById(timesheetId);
        } else {
            throw new RuntimeException("Timesheet not found!");
        }
    }

}
