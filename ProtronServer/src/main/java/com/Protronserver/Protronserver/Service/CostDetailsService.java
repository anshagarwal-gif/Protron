package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.Entities.PODetails;
import com.Protronserver.Protronserver.Repository.POConsumptionRepository;
import com.Protronserver.Protronserver.Repository.PORepository;
import com.Protronserver.Protronserver.Repository.POMilestoneRepository;
import com.Protronserver.Protronserver.Repository.SRNRepository;
import com.Protronserver.Protronserver.ResultDTOs.EligibleMilestone;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
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
    @Autowired private LoggedInUserUtils loggedInUserUtils;
    @Autowired private POConsumptionRepository poConsumptionRepository;


    /**
     * Calculates the remaining balance for a specific PO.
     */
    public BigDecimal getPOBalance(Long poId) {
        BigDecimal poAmount = poRepository.findPoAmountById(poId, loggedInUserUtils.getLoggedInUser().getTenant().getTenantId())
                .orElseThrow(() -> new EntityNotFoundException("PO not found with id: " + poId));

        BigDecimal totalSrnPaid = srnRepository.sumSrnAmountsByPoId(poId, loggedInUserUtils.getLoggedInUser().getTenant().getTenantId());
        return poAmount.subtract(totalSrnPaid);
    }

    /**
     * Calculates the remaining balance for a specific milestone.
     * Note: Requires poId in addition to msName to uniquely identify the milestone.
     */
    public BigDecimal getMilestoneBalance(Long poId, Long msId) {
        Integer milestoneAmountInt = poMilestoneRepository.findAmountByPoIdAndMsId(poId, msId, loggedInUserUtils.getLoggedInUser().getTenant().getTenantId())
                .orElseThrow(() -> new EntityNotFoundException("Milestone '" + msId + "' not found for PO id: " + poId));

        BigDecimal milestoneAmount = new BigDecimal(milestoneAmountInt);
        BigDecimal totalSrnPaid = srnRepository.sumSrnAmountsByPoIdAndMsId(poId, msId, loggedInUserUtils.getLoggedInUser().getTenant().getTenantId());

        return milestoneAmount.subtract(totalSrnPaid);
    }

    public BigDecimal getPOBalanceBasedOnConsumption(Long poId) {
        Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();

        PODetails po = poRepository.findById(poId).orElseThrow(()-> new RuntimeException("PO not found, id: " + poId));

        // Fetch total consumption (active)
        BigDecimal totalConsumption = poConsumptionRepository.sumConsumptionAmountsByPoNumber(po.getPoNumber(), tenantId);

        return po.getPoAmount().subtract(totalConsumption);
    }

    public BigDecimal getMilestoneBalanceBasedOnConsumption(Long poId, Long msId) {
        Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();

        // Fetch milestone amount
        Integer milestoneAmountInt = poMilestoneRepository.findAmountByPoIdAndMsId(poId, msId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Milestone '" + msId + "' not found for PO id: " + poId));

        BigDecimal milestoneAmount = new BigDecimal(milestoneAmountInt);

        PODetails po = poRepository.findById(poId).orElseThrow(()-> new RuntimeException("PO not found, id: " + poId));

        // Fetch total consumption on this milestone (active)
        BigDecimal totalConsumption = poConsumptionRepository.sumConsumptionAmountsByPoNumberAndMsId(po.getPoNumber(), msId, tenantId);

        return milestoneAmount.subtract(totalConsumption);
    }

    /**
     * Fetches all milestones for a PO that still have a positive balance.
     * Returns a list of objects containing the milestone ID, name, and balance.
     */
    public List<EligibleMilestone> getRemainingMilestones(Long poId) {
        // This part remains the same
        List<MilestoneInfo> allMilestones = poMilestoneRepository.findMilestoneInfoByPoId(poId, loggedInUserUtils.getLoggedInUser().getTenant().getTenantId());

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

    public List<EligibleMilestone> getRemainingMilestonesForCon(Long poId) {
        // This part remains the same
        List<MilestoneInfo> allMilestones = poMilestoneRepository.findMilestoneInfoByPoId(poId, loggedInUserUtils.getLoggedInUser().getTenant().getTenantId());

        return allMilestones.stream()
                // Map each milestone to a new DTO that includes the calculated balance
                .map(milestone -> {
                    BigDecimal balance = getMilestoneBalanceBasedOnConsumption(poId, milestone.getMsId());
                    return new EligibleMilestone(milestone.getMsId(), milestone.getMsName(), balance);
                })
                // Filter the list to include only those with a balance greater than zero
                .filter(dto -> dto.remainingBalance().compareTo(BigDecimal.ZERO) > 0)
                // Collect the results into a list
                .toList(); // or .collect(Collectors.toList());
    }
}
