package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.POMilestoneAddDTO;
import com.Protronserver.Protronserver.Entities.PODetails;
import com.Protronserver.Protronserver.Entities.POMilestone;
import com.Protronserver.Protronserver.Repository.POMilestoneRepository;
import com.Protronserver.Protronserver.Repository.PORepository;
import com.Protronserver.Protronserver.Repository.SRNRepository;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
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
        milestone.setStartTimestamp(LocalDateTime.now());
        milestone.setEndTimestamp(null);
        milestone.setLastUpdateBy(null);
        return poMilestoneRepository.save(milestone);
    }

    public POMilestone updateMilestone(Long id, POMilestoneAddDTO dto) {
        // 1. Fetch the existing milestone and its parent PO
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
                poDetail.getPoId(),
                existingMilestone.getMsId()
        );

        if (newMilestoneAmount.compareTo(totalSrnPaid) < 0) {
            throw new IllegalArgumentException("New milestone amount (" + newMilestoneAmount +
                    ") cannot be less than the total SRN amount already paid (" + totalSrnPaid + ").");
        }

        BigDecimal poAmount = poDetail.getPoAmount();
        BigDecimal currentTotalMilestoneSum = poMilestoneRepository.sumMilestoneAmountsByPoId(poDetail.getPoId());

        BigDecimal availableBudget = poAmount.subtract(currentTotalMilestoneSum).add(originalMilestoneAmount);

        if (newMilestoneAmount.compareTo(availableBudget) > 0) {
            throw new IllegalArgumentException("Updated milestone amount exceeds PO budget. " +
                    "Available budget for this milestone: " + availableBudget);
        }

        // --- VALIDATION END ---

        // Mark current version as ended
        existingMilestone.setEndTimestamp(LocalDateTime.now());
        existingMilestone.setLastUpdateBy(loggedInUserUtils.getLoggedInUser().getEmail());
        poMilestoneRepository.save(existingMilestone);

        // Create new version
        POMilestone newMilestone = new POMilestone();
        newMilestone.setPoDetail(poDetail); // maintain the association

        newMilestone.setMsName(dto.getMsName());
        newMilestone.setMsDesc(dto.getMsDesc());
        newMilestone.setMsAmount(dto.getMsAmount());
        newMilestone.setMsCurrency(dto.getMsCurrency());
        newMilestone.setMsDate(dto.getMsDate());
        newMilestone.setMsDuration(dto.getMsDuration());
        newMilestone.setMsRemarks(dto.getMsRemarks());

        // Versioning fields
        newMilestone.setStartTimestamp(LocalDateTime.now());
        newMilestone.setEndTimestamp(null);
        newMilestone.setLastUpdateBy(null);

        return poMilestoneRepository.save(newMilestone);
    }


    public List<POMilestone> getAllMilestones() {
        return poMilestoneRepository.findAllActiveMilestones();
    }

    public List<POMilestone> getMilestonesByPoId(Long poId) {
        return poMilestoneRepository.findByPoDetail_PoId(poId);
    }

    public POMilestone getMilestoneByMsId(Long id) {
        return poMilestoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Milestone not found with ID: " + id));
    }

}
