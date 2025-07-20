package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.POMilestoneAddDTO;
import com.Protronserver.Protronserver.Entities.PODetails;
import com.Protronserver.Protronserver.Entities.POMilestone;
import com.Protronserver.Protronserver.Repository.POMilestoneRepository;
import com.Protronserver.Protronserver.Repository.PORepository;
import com.Protronserver.Protronserver.Repository.SRNRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class POMilestoneService {

    @Autowired
    private POMilestoneRepository poMilestoneRepository;

    @Autowired
    private PORepository poRepository;

    @Autowired
    private SRNRepository srnRepository;

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
        BigDecimal existingMilestonesTotal = poMilestoneRepository.sumMilestoneAmountsByPoId(dto.getPoId());
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

        return poMilestoneRepository.save(milestone);
    }

    public POMilestone updateMilestone(Long id, POMilestoneAddDTO dto) {
        // 1. Fetch the existing milestone and its parent PO
        POMilestone existingMilestone = poMilestoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Milestone not found with ID: " + id));

        PODetails poDetail = existingMilestone.getPoDetail();

        // Store the original amount for calculation, and get the new amount from the DTO
        BigDecimal originalMilestoneAmount = new BigDecimal(existingMilestone.getMsAmount());
        BigDecimal newMilestoneAmount = new BigDecimal(dto.getMsAmount());


        // --- VALIDATION START ---

        // Currency Check: The new currency must match the PO's currency.
        if (dto.getMsCurrency() != null && !dto.getMsCurrency().equalsIgnoreCase(poDetail.getPoCurrency())) {
            throw new IllegalArgumentException("Milestone currency (" + dto.getMsCurrency() +
                    ") does not match the PO currency (" + poDetail.getPoCurrency() + ").");
        }

        // Check 2: The new milestone amount cannot be less than what has already been paid via SRNs.
        BigDecimal totalSrnPaid = srnRepository.sumSrnAmountsByPoIdAndMsName(
                poDetail.getPoId(),
                existingMilestone.getMsName() // Use the existing name for lookup
        );

        if (newMilestoneAmount.compareTo(totalSrnPaid) < 0) {
            throw new IllegalArgumentException("New milestone amount (" + newMilestoneAmount +
                    ") cannot be less than the total SRN amount already paid (" + totalSrnPaid + ").");
        }

        // Check 1: The total of all milestone amounts (with this update) should not exceed the PO amount.
        BigDecimal poAmount = poDetail.getPoAmount();
        BigDecimal currentTotalMilestoneSum = poMilestoneRepository.sumMilestoneAmountsByPoId(poDetail.getPoId());

        // Calculate the available budget space in the PO for this update
        BigDecimal availableBudget = poAmount.subtract(currentTotalMilestoneSum).add(originalMilestoneAmount);

        if (newMilestoneAmount.compareTo(availableBudget) > 0) {
            throw new IllegalArgumentException("Updated milestone amount exceeds PO budget. " +
                    "Available budget for this milestone: " + availableBudget);
        }

        // --- VALIDATION END ---


        // 3. If validations pass, apply the updates to the entity
        existingMilestone.setMsName(dto.getMsName());
        existingMilestone.setMsDesc(dto.getMsDesc());
        existingMilestone.setMsAmount(dto.getMsAmount());
        existingMilestone.setMsCurrency(dto.getMsCurrency());
        existingMilestone.setMsDate(dto.getMsDate());
        existingMilestone.setMsDuration(dto.getMsDuration());
        existingMilestone.setMsRemarks(dto.getMsRemarks());

        return poMilestoneRepository.save(existingMilestone);
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
