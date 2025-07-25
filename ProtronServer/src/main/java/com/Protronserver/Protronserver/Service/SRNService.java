package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.SRNDTO;
import com.Protronserver.Protronserver.Entities.PODetails;
import com.Protronserver.Protronserver.Entities.SRNDetails;
import com.Protronserver.Protronserver.Repository.POMilestoneRepository;
import com.Protronserver.Protronserver.Repository.PORepository;
import com.Protronserver.Protronserver.Repository.SRNRepository;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class SRNService {

    @Autowired
    private SRNRepository srnRepository;

    @Autowired
    private PORepository poDetailsRepository;

    @Autowired
    private POMilestoneRepository poMilestoneRepository;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    public SRNDetails addSRN(SRNDTO dto) {
        // 1. Fetch the parent PO
        PODetails poDetail = poDetailsRepository.findById(dto.getPoId())
                .orElseThrow(() -> new RuntimeException("PO not found with ID: " + dto.getPoId()));

        // 2. --- VALIDATION START ---

        // Currency Check: Ensure the SRN currency matches the PO currency
        if (!poDetail.getPoCurrency().equalsIgnoreCase(dto.getSrnCurrency())) {
            throw new IllegalArgumentException("SRN currency (" + dto.getSrnCurrency() +
                    ") does not match PO currency (" + poDetail.getPoCurrency() + ").");
        }

        BigDecimal newSrnAmount = new BigDecimal(dto.getSrnAmount());

        // Check if the SRN is being submitted against a specific milestone
        if (dto.getMsId() != null) {
            // --- Milestone-level Validation ---

            // Get the total amount for the specified milestone
            Integer milestoneAmountInt = poMilestoneRepository.findAmountByPoIdAndMsId(poDetail.getPoId(), dto.getMsId())
                    .orElseThrow(() -> new RuntimeException("Milestone '" + dto.getMsId() + "' not found for this PO."));

            // Get the sum of all SRNs already paid against this milestone
            BigDecimal paidAmount = srnRepository.sumSrnAmountsByPoIdAndMsId(poDetail.getPoId(), dto.getMsId());

            BigDecimal milestoneBalance = new BigDecimal(milestoneAmountInt).subtract(paidAmount);

            // Check if the new SRN amount exceeds the remaining milestone balance
            if (newSrnAmount.compareTo(milestoneBalance) > 0) {
                throw new IllegalArgumentException("SRN amount exceeds the remaining milestone balance. " +
                        "Remaining balance for '" + dto.getMsId() + "': " + milestoneBalance);
            }
        } else {
            // --- PO-level Validation (when no milestone is specified) ---

            // First, check that this PO doesn't have any milestones.
            if (poMilestoneRepository.countByPoId(poDetail.getPoId()) > 0) {
                throw new IllegalArgumentException("This PO has milestones. SRN must be associated with a specific milestone name.");
            }

            // Get the sum of all SRNs already paid against this entire PO
            BigDecimal totalPaidForPO = srnRepository.sumSrnAmountsByPoId(poDetail.getPoId());

            BigDecimal poBalance = poDetail.getPoAmount().subtract(totalPaidForPO);

            // Check if the new SRN amount exceeds the remaining PO balance
            if (newSrnAmount.compareTo(poBalance) > 0) {
                throw new IllegalArgumentException("SRN amount exceeds the remaining PO balance. " +
                        "Remaining PO balance: " + poBalance);
            }
        }

        // --- VALIDATION END ---

        // 3. If validations pass, create and save the SRN
        SRNDetails srnDetails = new SRNDetails();
        srnDetails.setPoDetail(poDetail);
        srnDetails.setPoNumber(dto.getPoNumber());
        if (dto.getMsId() != null) {
            srnDetails.setMilestone(poMilestoneRepository.findById(dto.getMsId())
                    .orElseThrow(() -> new RuntimeException("Milestone not found with ID: " + dto.getMsId())));
        } // Can be null
        srnDetails.setSrnName(dto.getSrnName());
        srnDetails.setSrnDsc(dto.getSrnDsc());
        srnDetails.setSrnAmount(dto.getSrnAmount());
        srnDetails.setSrnCurrency(dto.getSrnCurrency());
        srnDetails.setSrnRemarks(dto.getSrnRemarks());
        srnDetails.setCreatedTimestamp(LocalDateTime.now());
        srnDetails.setLastUpdateTimestamp(null);
        srnDetails.setUpdatedBy(null);

        return srnRepository.save(srnDetails);
    }

    public SRNDetails updateSRN(Long srnId, SRNDTO dto) {
        SRNDetails existingSRN = srnRepository.findById(srnId)
                .orElseThrow(() -> new RuntimeException("SRN not found with ID: " + srnId));

        BigDecimal originalSrnAmount = new BigDecimal(existingSRN.getSrnAmount());
        PODetails poDetail = existingSRN.getPoDetail();

        BigDecimal newSrnAmount = (dto.getSrnAmount() != null)
                ? new BigDecimal(dto.getSrnAmount())
                : originalSrnAmount;

        // --- VALIDATION START ---

        if (dto.getSrnCurrency() != null && !poDetail.getPoCurrency().equalsIgnoreCase(dto.getSrnCurrency())) {
            throw new IllegalArgumentException("SRN currency (" + dto.getSrnCurrency() +
                    ") does not match PO currency (" + poDetail.getPoCurrency() + ").");
        }

        Long milestoneId = (dto.getMsId() != null)
                ? dto.getMsId()
                : (existingSRN.getMilestone() != null ? existingSRN.getMilestone().getMsId() : null);

        if (milestoneId != null) {
            Integer milestoneAmountInt = poMilestoneRepository.findAmountByPoIdAndMsId(poDetail.getPoId(), milestoneId)
                    .orElseThrow(() -> new RuntimeException("Milestone '" + milestoneId + "' not found for this PO."));
            BigDecimal currentPaidAmount = srnRepository.sumSrnAmountsByPoIdAndMsId(poDetail.getPoId(), milestoneId);
            BigDecimal availableBalance = new BigDecimal(milestoneAmountInt)
                    .subtract(currentPaidAmount)
                    .add(originalSrnAmount);

            if (newSrnAmount.compareTo(availableBalance) > 0) {
                throw new IllegalArgumentException("Updated SRN amount exceeds the remaining milestone balance. " +
                        "Available balance for update: " + availableBalance);
            }
        } else {
            if (poMilestoneRepository.countByPoId(poDetail.getPoId()) > 0) {
                throw new IllegalArgumentException("This PO has milestones. SRN must be associated with a specific milestone name.");
            }

            BigDecimal totalPaidForPO = srnRepository.sumSrnAmountsByPoId(poDetail.getPoId());
            BigDecimal availableBalance = poDetail.getPoAmount()
                    .subtract(totalPaidForPO)
                    .add(originalSrnAmount);

            if (newSrnAmount.compareTo(availableBalance) > 0) {
                throw new IllegalArgumentException("Updated SRN amount exceeds the remaining PO balance. " +
                        "Available PO balance for update: " + availableBalance);
            }
        }

        // --- VALIDATION END ---

        // Versioning: Mark old record as ended
        existingSRN.setLastUpdateTimestamp(LocalDateTime.now());
        existingSRN.setUpdatedBy(loggedInUserUtils.getLoggedInUser().getEmail());
        srnRepository.save(existingSRN);

        // Create new version
        SRNDetails newSRN = new SRNDetails();
        newSRN.setPoDetail(poDetail);
        newSRN.setPoNumber(poDetail.getPoNumber());

        if (dto.getMsId() != null) {
            newSRN.setMilestone(poMilestoneRepository.findById(dto.getMsId())
                    .orElseThrow(() -> new RuntimeException("Milestone not found with ID: " + dto.getMsId())));
        }

        newSRN.setSrnName(dto.getSrnName());
        newSRN.setSrnDsc(dto.getSrnDsc());
        newSRN.setSrnAmount(dto.getSrnAmount());
        newSRN.setSrnCurrency(dto.getSrnCurrency());
        newSRN.setSrnRemarks(dto.getSrnRemarks());

        newSRN.setCreatedTimestamp(LocalDateTime.now());
        newSRN.setLastUpdateTimestamp(null);
        newSRN.setUpdatedBy(null);

        return srnRepository.save(newSRN);
    }


    public SRNDetails getSRNById(Long srnId) {
        return srnRepository.findById(srnId)
                .orElseThrow(() -> new RuntimeException("SRN not found with ID: " + srnId));
    }

    public List<SRNDetails> getAllSRNs() {
        return srnRepository.findAllActive();
    }

    public List<SRNDetails> getSRNsByPoId(Long poId) {
        return srnRepository.findByPoDetail_PoId(poId);
    }

    public List<SRNDetails> getSRNsByPoNumber(String poNumber) {
        return srnRepository.findByPoNumber(poNumber);
    }

    public List<SRNDetails> getSRNsByMilestoneName(String msName) {
        return srnRepository.findByMilestone_MsName(msName);
    }

    public void deleteSRN(Long srnId) {
        SRNDetails srn = srnRepository.findById(srnId)
                .orElseThrow(() -> new RuntimeException("SRN not found with ID: " + srnId));

        srn.setLastUpdateTimestamp(LocalDateTime.now());
        srn.setUpdatedBy(loggedInUserUtils.getLoggedInUser().getEmail());

        srnRepository.save(srn);
    }


    public Integer getTotalSRNAmountByPoId(Long poId) {
        List<SRNDetails> srnList = srnRepository.findByPoDetail_PoId(poId);
        return srnList.stream()
                .mapToInt(srn -> srn.getSrnAmount() != null ? srn.getSrnAmount() : 0)
                .sum();
    }
}