package com.protron.Protron.service;

import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

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
}