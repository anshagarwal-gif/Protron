package com.protron.Protron.service;

import org.flowable.task.api.Task;

import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TimesheetWorkflowService {

    @Autowired
    private RuntimeService runtimeService;

    @Autowired
    private TaskService taskService;

    public String startTimesheetApproval(String employeeId, String timesheetId) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("initiator", employeeId);
        variables.put("timesheetId", timesheetId);

        // Start the process instance
        return runtimeService.startProcessInstanceByKey("timesheetApprovalProcess", variables)
                .getProcessInstanceId();
    }

    public void approveTimesheet(String taskId, String managerId) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("approved", true);
        variables.put("managerId", managerId);

        taskService.complete(taskId, variables);
    }

    public void rejectTimesheet(String taskId, String managerId, String reason) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("approved", false);
        variables.put("managerId", managerId);
        variables.put("rejectionReason", reason);

        taskService.complete(taskId, variables);
    }

    public List<Map<String, Object>> getPendingApprovals(String managerId) {
        List<Task> tasks = taskService.createTaskQuery()
                .taskCandidateGroup(managerId) // Fetch tasks assigned to the manager group
                .list();

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

    public void resubmitTimesheet(String taskId, String employeeId) {
        Task task = taskService.createTaskQuery().taskId(taskId).singleResult();
        if (task != null) {
            Map<String, Object> variables = new HashMap<>();
            variables.put("approved", false);
            variables.put("initiator", employeeId);
            taskService.complete(taskId, variables);
        } else {
            throw new RuntimeException("Task not found!");
        }
    }

}