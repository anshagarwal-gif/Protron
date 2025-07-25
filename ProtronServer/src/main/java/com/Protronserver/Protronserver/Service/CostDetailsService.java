package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.Repository.PORepository;
import com.Protronserver.Protronserver.Repository.POMilestoneRepository;
import com.Protronserver.Protronserver.Repository.SRNRepository;
import com.Protronserver.Protronserver.ResultDTOs.EligibleMilestone;
import com.Protronserver.Protronserver.Utils.MilestoneInfo;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CostDetailsService {

    @Autowired private PORepository poRepository;
    @Autowired private POMilestoneRepository poMilestoneRepository;
    @Autowired private SRNRepository srnRepository;

    /**
     * Calculates the remaining balance for a specific PO.
     */
    public BigDecimal getPOBalance(Long poId) {
        BigDecimal poAmount = poRepository.findPoAmountById(poId)
                .orElseThrow(() -> new EntityNotFoundException("PO not found with id: " + poId));

        BigDecimal totalSrnPaid = srnRepository.sumSrnAmountsByPoId(poId);
        return poAmount.subtract(totalSrnPaid);
    }

    /**
     * Calculates the remaining balance for a specific milestone.
     * Note: Requires poId in addition to msName to uniquely identify the milestone.
     */
    public BigDecimal getMilestoneBalance(Long poId, Long msId) {
        Integer milestoneAmountInt = poMilestoneRepository.findAmountByPoIdAndMsId(poId, msId)
                .orElseThrow(() -> new EntityNotFoundException("Milestone '" + msId + "' not found for PO id: " + poId));

        BigDecimal milestoneAmount = new BigDecimal(milestoneAmountInt);
        BigDecimal totalSrnPaid = srnRepository.sumSrnAmountsByPoIdAndMsId(poId, msId);

        return milestoneAmount.subtract(totalSrnPaid);
    }

    /**
     * Fetches all milestones for a PO that still have a positive balance.
     * Returns a list of objects containing the milestone ID, name, and balance.
     */
    public List<EligibleMilestone> getRemainingMilestones(Long poId) {
        // This part remains the same
        List<MilestoneInfo> allMilestones = poMilestoneRepository.findMilestoneInfoByPoId(poId);

        return allMilestones.stream()
                // Map each milestone to a new DTO that includes the calculated balance
                .map(milestone -> {
                    BigDecimal balance = getMilestoneBalance(poId, milestone.getMsId());
                    return new EligibleMilestone(milestone.getMsId(), milestone.getMsName(), balance);
                })
                // Filter the list to include only those with a balance greater than zero
                .filter(dto -> dto.remainingBalance().compareTo(BigDecimal.ZERO) > 0)
                // Collect the results into a list
                .toList(); // or .collect(Collectors.toList());
    }
}
