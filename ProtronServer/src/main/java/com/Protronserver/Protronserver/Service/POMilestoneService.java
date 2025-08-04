package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.POMilestoneAddDTO;
import com.Protronserver.Protronserver.Entities.*;
import com.Protronserver.Protronserver.Repository.*;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class POMilestoneService {

    @Autowired
    private POMilestoneRepository poMilestoneRepository;

    @Autowired
    private PORepository poRepository;

    @Autowired
    private SRNRepository srnRepository;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    @Autowired
    private POConsumptionRepository poConsumptionRepository;

    @Autowired
    private POAttachmentRepository poAttachmentRepository;

    public POMilestone addMilestone(POMilestoneAddDTO dto) {
        // 1. Fetch the parent PO
        PODetails poDetail = poRepository.findById(dto.getPoId())
                .orElseThrow(() -> new RuntimeException("PO not found with ID: " + dto.getPoId()));

        // 2. --- VALIDATION START ---

        // Currency Check: Ensure the milestone currency matches the PO currency
        if (!poDetail.getPoCurrency().equalsIgnoreCase(dto.getMsCurrency())) {
            throw new IllegalArgumentException("Milestone currency (" + dto.getMsCurrency() +
                    ") does not match PO currency (" + poDetail.getPoCurrency() + ").");
        }

        // Cost Check: Ensure total milestone value does not exceed PO value
        BigDecimal poAmount = poDetail.getPoAmount();
        BigDecimal existingMilestonesTotal = poMilestoneRepository.sumMilestoneAmountsByPoId(dto.getPoId(), loggedInUserUtils.getLoggedInUser().getTenant().getTenantId());
        BigDecimal newMilestoneAmount = new BigDecimal(dto.getMsAmount());

        if (existingMilestonesTotal.add(newMilestoneAmount).compareTo(poAmount) > 0) {
            throw new IllegalArgumentException("Cannot add milestone. Total milestone amount will exceed PO amount. " +
                    "Remaining capacity: " + poAmount.subtract(existingMilestonesTotal));
        }

        // --- VALIDATION END ---

        // 3. If validations pass, create and save the milestone
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
        milestone.setStartTimestamp(LocalDateTime.now());

        User loggedInUser = loggedInUserUtils.getLoggedInUser();
        milestone.setTenantId(loggedInUser.getTenant().getTenantId());

        milestone.setEndTimestamp(null);
        milestone.setLastUpdateBy(null);
        return poMilestoneRepository.save(milestone);
    }

    @Transactional
    public POMilestone updateMilestone(Long id, POMilestoneAddDTO dto) {

        Long currentTenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();

        POMilestone existingMilestone = poMilestoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Milestone not found with ID: " + id));

        PODetails poDetail = existingMilestone.getPoDetail();

        BigDecimal originalMilestoneAmount = new BigDecimal(existingMilestone.getMsAmount());
        BigDecimal newMilestoneAmount = new BigDecimal(dto.getMsAmount());

        // --- VALIDATION START ---
        if (dto.getMsCurrency() != null && !dto.getMsCurrency().equalsIgnoreCase(poDetail.getPoCurrency())) {
            throw new IllegalArgumentException("Milestone currency (" + dto.getMsCurrency() +
                    ") does not match the PO currency (" + poDetail.getPoCurrency() + ").");
        }

        BigDecimal totalSrnPaid = srnRepository.sumSrnAmountsByPoIdAndMsId(
                poDetail.getPoId(), existingMilestone.getMsId(), currentTenantId);

        if (newMilestoneAmount.compareTo(totalSrnPaid) < 0) {
            throw new IllegalArgumentException("New milestone amount (" + newMilestoneAmount +
                    ") cannot be less than the total SRN amount already paid (" + totalSrnPaid + ").");
        }

        BigDecimal poAmount = poDetail.getPoAmount();
        BigDecimal currentTotalMilestoneSum = poMilestoneRepository.sumMilestoneAmountsByPoId(poDetail.getPoId(), currentTenantId);
        BigDecimal availableBudget = poAmount.subtract(currentTotalMilestoneSum).add(originalMilestoneAmount);

        if (newMilestoneAmount.compareTo(availableBudget) > 0) {
            throw new IllegalArgumentException("Updated milestone amount exceeds PO budget. " +
                    "Available budget for this milestone: " + availableBudget);
        }
        // --- VALIDATION END ---

        String updatedBy = loggedInUserUtils.getLoggedInUser().getEmail();

        // 1. End the old milestone
        existingMilestone.setEndTimestamp(LocalDateTime.now());
        existingMilestone.setLastUpdateBy(updatedBy);
        poMilestoneRepository.save(existingMilestone);

        // 2. Create a new milestone version
        POMilestone newMilestone = new POMilestone();
        newMilestone.setPoDetail(poDetail);
        newMilestone.setPoNumber(poDetail.getPoNumber());
        newMilestone.setMsName(dto.getMsName());
        newMilestone.setMsDesc(dto.getMsDesc());
        newMilestone.setMsAmount(dto.getMsAmount());
        newMilestone.setMsCurrency(dto.getMsCurrency());
        newMilestone.setMsDate(dto.getMsDate());
        newMilestone.setMsDuration(dto.getMsDuration());
        newMilestone.setMsRemarks(dto.getMsRemarks());
        newMilestone.setStartTimestamp(LocalDateTime.now());
        newMilestone.setTenantId(existingMilestone.getTenantId());
        newMilestone.setEndTimestamp(null);
        newMilestone.setLastUpdateBy(null);

        POMilestone savedNewMilestone = poMilestoneRepository.save(newMilestone);

        poAttachmentRepository.updateReferenceId("MS", existingMilestone.getMsId(), savedNewMilestone.getMsId());


        List<SRNDetails> srnsToUpdate = srnRepository.findByPoIdAndMsId(poDetail.getPoId(), id, currentTenantId);
        for (SRNDetails srn : srnsToUpdate) {
            srn.setMilestone(savedNewMilestone);
            srnRepository.save(srn);
        }

        // 4. Update milestone in active POConsumptions
        List<POConsumption> consumptionsToUpdate = poConsumptionRepository.findByPoNumberAndMilestone_MsName(
                poDetail.getPoNumber(), existingMilestone.getMsName(), currentTenantId);
        for (POConsumption consumption : consumptionsToUpdate) {
            consumption.setMilestone(savedNewMilestone);
            poConsumptionRepository.save(consumption);
        }

        return savedNewMilestone;
    }



    public List<POMilestone> getAllMilestones() {
        return poMilestoneRepository.findAllActiveMilestones(loggedInUserUtils.getLoggedInUser().getTenant().getTenantId());
    }

    public List<POMilestone> getMilestonesByPoId(Long poId) {
        return poMilestoneRepository.findByPoDetail_PoId(poId, loggedInUserUtils.getLoggedInUser().getTenant().getTenantId());
    }

    public POMilestone getMilestoneByMsId(Long id) {
        return poMilestoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Milestone not found with ID: " + id));
    }

}
