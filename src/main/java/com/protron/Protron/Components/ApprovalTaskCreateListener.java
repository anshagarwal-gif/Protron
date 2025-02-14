package com.protron.Protron.Components;

import org.flowable.engine.delegate.TaskListener;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@Component
public class ApprovalTaskCreateListener implements TaskListener {

    private static final Logger logger = LoggerFactory.getLogger(ApprovalTaskCreateListener.class);

    @Override
    public void notify(org.flowable.task.service.delegate.DelegateTask delegateTask) {
        // Log the task details
        logger.info("Task Created: {}", delegateTask.getName());

        // Get the list of approvers assigned to this task
        List<String> approverList = (List<String>) delegateTask.getVariable("approverList");

        if (approverList == null || approverList.isEmpty()) {
            logger.error("Approver list is missing or empty!");
            return;
        }

        // Get the current approver
        String currentApprover = (String) delegateTask.getVariable("currentApprover");

        if (currentApprover == null) {
            logger.warn("Current approver is null! Assigning first approver from the list.");
            currentApprover = approverList.get(0); // Assign the first approver
            delegateTask.setVariable("currentApprover", currentApprover);
        }

        // Assign the task to the current approver
        delegateTask.setAssignee(currentApprover);
        logger.info("Task assigned to: {}", currentApprover);
    }
}
