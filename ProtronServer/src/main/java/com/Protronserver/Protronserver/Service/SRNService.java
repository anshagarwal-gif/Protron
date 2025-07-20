package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.SRNDTO;
import com.Protronserver.Protronserver.Entities.PODetails;
import com.Protronserver.Protronserver.Entities.SRNDetails;
import com.Protronserver.Protronserver.Repository.POMilestoneRepository;
import com.Protronserver.Protronserver.Repository.PORepository;
import com.Protronserver.Protronserver.Repository.SRNRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
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
        if (dto.getMsName() != null && !dto.getMsName().isBlank()) {
            // --- Milestone-level Validation ---

            // Get the total amount for the specified milestone
            Integer milestoneAmountInt = poMilestoneRepository.findAmountByPoIdAndMsName(poDetail.getPoId(), dto.getMsName())
                    .orElseThrow(() -> new RuntimeException("Milestone '" + dto.getMsName() + "' not found for this PO."));

            // Get the sum of all SRNs already paid against this milestone
            BigDecimal paidAmount = srnRepository.sumSrnAmountsByPoIdAndMsName(poDetail.getPoId(), dto.getMsName());

            BigDecimal milestoneBalance = new BigDecimal(milestoneAmountInt).subtract(paidAmount);

            // Check if the new SRN amount exceeds the remaining milestone balance
            if (newSrnAmount.compareTo(milestoneBalance) > 0) {
                throw new IllegalArgumentException("SRN amount exceeds the remaining milestone balance. " +
                        "Remaining balance for '" + dto.getMsName() + "': " + milestoneBalance);
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
        srnDetails.setMsName(dto.getMsName()); // Can be null
        srnDetails.setSrnName(dto.getSrnName());
        srnDetails.setSrnDsc(dto.getSrnDsc());
        srnDetails.setSrnAmount(dto.getSrnAmount());
        srnDetails.setSrnCurrency(dto.getSrnCurrency());
        srnDetails.setSrnRemarks(dto.getSrnRemarks());

        return srnRepository.save(srnDetails);
    }

    public SRNDetails updateSRN(Long srnId, SRNDTO dto) {
        // 1. Fetch the existing SRN entity from the database
        SRNDetails srnDetails = srnRepository.findById(srnId)
                .orElseThrow(() -> new RuntimeException("SRN not found with ID: " + srnId));

        // Store the original amount before any changes. This is critical for the balance calculation.
        BigDecimal originalSrnAmount = new BigDecimal(srnDetails.getSrnAmount());

        // 2. Fetch the parent PO. Use the existing PO from the SRN entity.
        PODetails poDetail = srnDetails.getPoDetail();

        // The DTO might contain a new amount. Default to the original if not provided.
        BigDecimal newSrnAmount = (dto.getSrnAmount() != null)
                ? new BigDecimal(dto.getSrnAmount())
                : originalSrnAmount;

        // --- VALIDATION START ---

        // Currency Check: If a new currency is provided, it must match the PO's currency.
        if (dto.getSrnCurrency() != null && !poDetail.getPoCurrency().equalsIgnoreCase(dto.getSrnCurrency())) {
            throw new IllegalArgumentException("SRN currency (" + dto.getSrnCurrency() +
                    ") does not match PO currency (" + poDetail.getPoCurrency() + ").");
        }

        // Use the new milestone name from the DTO, or the existing one if not provided.
        String milestoneName = (dto.getMsName() != null) ? dto.getMsName() : srnDetails.getMsName();

        // Check if the SRN is being submitted against a specific milestone
        if (milestoneName != null && !milestoneName.isBlank()) {
            // --- Milestone-level Validation ---

            Integer milestoneAmountInt = poMilestoneRepository.findAmountByPoIdAndMsName(poDetail.getPoId(), milestoneName)
                    .orElseThrow(() -> new RuntimeException("Milestone '" + milestoneName + "' not found for this PO."));

            // Get the sum of all SRNs already paid against this milestone (this sum includes the originalSrnAmount)
            BigDecimal currentPaidAmount = srnRepository.sumSrnAmountsByPoIdAndMsName(poDetail.getPoId(), milestoneName);

            // Calculate the balance available for the update.
            // (Milestone Total) - (Current Paid Amount) + (This SRN's Original Amount)
            BigDecimal availableBalance = new BigDecimal(milestoneAmountInt).subtract(currentPaidAmount).add(originalSrnAmount);

            // Check if the new SRN amount exceeds the available balance
            if (newSrnAmount.compareTo(availableBalance) > 0) {
                throw new IllegalArgumentException("Updated SRN amount exceeds the remaining milestone balance. " +
                        "Available balance for update: " + availableBalance);
            }
        } else {
            // --- PO-level Validation (when no milestone is specified) ---

            if (poMilestoneRepository.countByPoId(poDetail.getPoId()) > 0) {
                throw new IllegalArgumentException("This PO has milestones. SRN must be associated with a specific milestone name.");
            }

            BigDecimal totalPaidForPO = srnRepository.sumSrnAmountsByPoId(poDetail.getPoId());

            // Calculate the balance available for the update.
            // (PO Total) - (Current Paid Amount) + (This SRN's Original Amount)
            BigDecimal availableBalance = poDetail.getPoAmount().subtract(totalPaidForPO).add(originalSrnAmount);

            if (newSrnAmount.compareTo(availableBalance) > 0) {
                throw new IllegalArgumentException("Updated SRN amount exceeds the remaining PO balance. " +
                        "Available PO balance for update: " + availableBalance);
            }
        }

        // --- VALIDATION END ---

        // 3. If validations pass, apply updates to the entity
        // Note: We don't allow changing the parent PO during an SRN update.
        if (dto.getPoNumber() != null) srnDetails.setPoNumber(dto.getPoNumber());
        if (dto.getMsName() != null) srnDetails.setMsName(dto.getMsName());
        if (dto.getSrnName() != null) srnDetails.setSrnName(dto.getSrnName());
        if (dto.getSrnDsc() != null) srnDetails.setSrnDsc(dto.getSrnDsc());
        if (dto.getSrnAmount() != null) srnDetails.setSrnAmount(dto.getSrnAmount());
        if (dto.getSrnCurrency() != null) srnDetails.setSrnCurrency(dto.getSrnCurrency());
        if (dto.getSrnRemarks() != null) srnDetails.setSrnRemarks(dto.getSrnRemarks());

        // srnDetails.setLastUpdateTimestamp(new Date()); // Uncomment if you have this field
        // srnDetails.setUpdatedBy("current_user"); // Set the user who performed the update

        return srnRepository.save(srnDetails);
    }

    public SRNDetails getSRNById(Long srnId) {
        return srnRepository.findById(srnId)
                .orElseThrow(() -> new RuntimeException("SRN not found with ID: " + srnId));
    }

    public List<SRNDetails> getAllSRNs() {
        return srnRepository.findAll();
    }

    public List<SRNDetails> getSRNsByPoId(Long poId) {
        return srnRepository.findByPoDetail_PoId(poId);
    }

    public List<SRNDetails> getSRNsByPoNumber(String poNumber) {
        return srnRepository.findByPoNumber(poNumber);
    }

    public List<SRNDetails> getSRNsByMilestoneName(String msName) {
        return srnRepository.findByMsName(msName);
    }

    public void deleteSRN(Long srnId) {
        if (!srnRepository.existsById(srnId)) {
            throw new RuntimeException("SRN not found with ID: " + srnId);
        }
        srnRepository.deleteById(srnId);
    }

    public Integer getTotalSRNAmountByPoId(Long poId) {
        List<SRNDetails> srnList = srnRepository.findByPoDetail_PoId(poId);
        return srnList.stream()
                .mapToInt(srn -> srn.getSrnAmount() != null ? srn.getSrnAmount() : 0)
                .sum();
    }
}