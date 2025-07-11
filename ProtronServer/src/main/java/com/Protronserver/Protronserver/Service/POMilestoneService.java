package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.POMilestoneAddDTO;
import com.Protronserver.Protronserver.Entities.PODetails;
import com.Protronserver.Protronserver.Entities.POMilestone;
import com.Protronserver.Protronserver.Repository.POMilestoneRepository;
import com.Protronserver.Protronserver.Repository.PORepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class POMilestoneService {

    @Autowired
    private POMilestoneRepository poMilestoneRepository;

    @Autowired
    private PORepository poRepository;

    public POMilestone addMilestone(POMilestoneAddDTO dto) {
        PODetails poDetail = poRepository.findById(dto.getPoId())
                .orElseThrow(() -> new RuntimeException("PO not found with ID: " + dto.getPoId()));

        POMilestone milestone = new POMilestone();
        milestone.setPoDetail(poDetail);
        milestone.setPoNumber(poDetail.getPoNumber());
        milestone.setMsName(dto.getMsName());
        milestone.setMsDesc(dto.getMsDesc());
        milestone.setMsAmount(dto.getMsAmount());
        milestone.setMsCurrency(dto.getMsCurrency());
        milestone.setMsDate(dto.getMsDate());
        milestone.setMsDuration(dto.getMsDuration());
        milestone.setMsRemarks(dto.getMsRemarks());

        return poMilestoneRepository.save(milestone);
    }

    public POMilestone updateMilestone(Long id, POMilestoneAddDTO dto) {
        POMilestone existing = poMilestoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Milestone not found with ID: " + id));

        PODetails poDetail = poRepository.findById(dto.getPoId())
                .orElseThrow(() -> new RuntimeException("PO not found with ID: " + dto.getPoId()));

        existing.setPoDetail(poDetail);
        existing.setPoNumber(poDetail.getPoNumber());
        existing.setMsName(dto.getMsName());
        existing.setMsDesc(dto.getMsDesc());
        existing.setMsAmount(dto.getMsAmount());
        existing.setMsCurrency(dto.getMsCurrency());
        existing.setMsDate(dto.getMsDate());
        existing.setMsDuration(dto.getMsDuration());
        existing.setMsRemarks(dto.getMsRemarks());

        return poMilestoneRepository.save(existing);
    }

    public List<POMilestone> getAllMilestones() {
        return poMilestoneRepository.findAll();
    }

    public List<POMilestone> getMilestonesByPoId(Long poId) {
        return poMilestoneRepository.findByPoDetail_PoId(poId);
    }

    public POMilestone getMilestoneByMsId(Long id) {
        return poMilestoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Milestone not found with ID: " + id));
    }

}
