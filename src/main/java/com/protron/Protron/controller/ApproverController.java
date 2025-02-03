package com.protron.Protron.controller;

import com.protron.Protron.entities.Approver;
import com.protron.Protron.service.ApproverService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/approvers")
public class ApproverController {
    private final ApproverService approverService;

    public ApproverController(ApproverService approverService) {
        this.approverService = approverService;
    }

    @GetMapping("/getApprovers")
    public List<Approver> getAllApprovers() {
        return approverService.getAllApprovers();
    }
}

