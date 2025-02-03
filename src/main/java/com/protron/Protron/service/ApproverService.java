package com.protron.Protron.service;

import com.protron.Protron.entities.Approver;
import com.protron.Protron.repository.ApproverRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ApproverService {
    private final ApproverRepository approverRepository;

    public ApproverService(ApproverRepository approverRepository) {
        this.approverRepository = approverRepository;
    }

    public List<Approver> getAllApprovers() {
        return approverRepository.findAll();
    }
}

