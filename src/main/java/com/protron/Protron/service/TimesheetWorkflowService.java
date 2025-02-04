package com.protron.Protron.service;

import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.flowable.task.api.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TimesheetWorkflowService {

    @Autowired
    private RuntimeService runtimeService;

    @Autowired
    private TaskService taskService;

    /**
     * Start the timesheet approval process.
     */
    public String startTimesheetApproval(String employeeId, Long timesheetId) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("initiator", employeeId);
        variables.put("timesheetId", timesheetId);

        try {
            String processInstanceId = runtimeService.startProcessInstanceByKey("timesheetApprovalProcess", variables)
                    .getProcessInstanceId();
            return "Timesheet Approval Process Started. Process Instance ID: " + processInstanceId;
        } catch (Exception e) {
            throw new RuntimeException("Error starting timesheet approval process: " + e.getMessage());
        }
    }

    /**
     * Approve a timesheet task.
     */
    public void approveTimesheet(String taskId, String managerId) {
        Optional<Task> taskOpt = Optional.ofNullable(taskService.createTaskQuery().taskId(taskId).singleResult());

        if (taskOpt.isPresent()) {
            Map<String, Object> variables = new HashMap<>();
            variables.put("approved", true);
            variables.put("managerId", managerId);

            taskService.complete(taskId, variables);
            System.out.println("Timesheet Approved: Task ID " + taskId);
        } else {
            throw new RuntimeException("Task with ID " + taskId + " not found!");
        }
    }

    /**
     * Reject a timesheet task with a reason.
     */
    public void rejectTimesheet(String taskId, String managerId, String reason) {
        Optional<Task> taskOpt = Optional.ofNullable(taskService.createTaskQuery().taskId(taskId).singleResult());

        if (taskOpt.isPresent()) {
            Map<String, Object> variables = new HashMap<>();
            variables.put("approved", false);
            variables.put("managerId", managerId);
            variables.put("rejectionReason", reason);

            taskService.complete(taskId, variables);
            System.out.println("Timesheet Rejected: Task ID " + taskId);
        } else {
            throw new RuntimeException("Task with ID " + taskId + " not found!");
        }
    }

    /**
     * Fetch all pending approval tasks assigned to a manager.
     */
    public List<Map<String, Object>> getPendingApprovals(String managerId) {
        List<Task> tasks = taskService.createTaskQuery()
                .taskAssignee(managerId) // Fetch tasks specifically assigned to this manager
                .list();

        if (tasks.isEmpty()) {
            System.out.println("No pending approvals found for Manager ID: " + managerId);
        }

        return tasks.stream().map(task -> {
            Map<String, Object> taskData = new HashMap<>();
            taskData.put("taskId", task.getId());
            taskData.put("name", task.getName());
            taskData.put("assignee", task.getAssignee());
            taskData.put("timesheetId", taskService.getVariable(task.getId(), "timesheetId"));
            taskData.put("approvalLevel", taskService.getVariable(task.getId(), "approvalLevel"));
            return taskData;
        }).collect(Collectors.toList());
    }

    /**
     * Resubmit a rejected timesheet.
     */
    public void resubmitTimesheet(String taskId, String employeeId) {
        Optional<Task> taskOpt = Optional.ofNullable(taskService.createTaskQuery().taskId(taskId).singleResult());

        if (taskOpt.isPresent()) {
            Map<String, Object> variables = new HashMap<>();
            variables.put("approved", false);
            variables.put("initiator", employeeId);

            taskService.complete(taskId, variables);
            System.out.println("Timesheet Resubmitted: Task ID " + taskId);
        } else {
            throw new RuntimeException("Task with ID " + taskId + " not found!");
        }
    }
}
