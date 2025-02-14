package com.protron.Protron.Components;

import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;
import java.util.*;

@Component
public class InitializeProcessDelegate implements JavaDelegate {
    @Override
    public void execute(DelegateExecution execution) {
        @SuppressWarnings("unchecked")
        List<String> approverEmails = (List<String>) execution.getVariable("approverList");
        if (approverEmails == null) {
            approverEmails = new ArrayList<>();
        }

        // Initialize process variables
        execution.setVariable("currentApprovalCount", 0);
        execution.setVariable("totalApprovers", approverEmails.size());
        execution.setVariable("allApproved", true);
        execution.setVariable("approvedBy", new ArrayList<String>());
        execution.setVariable("actedBy", new ArrayList<String>());
    }
}