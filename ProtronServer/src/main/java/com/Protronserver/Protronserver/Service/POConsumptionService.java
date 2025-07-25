package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.POConsumptionDTO;
import com.Protronserver.Protronserver.Entities.POConsumption;
import com.Protronserver.Protronserver.Entities.POMilestone;
import com.Protronserver.Protronserver.Repository.POConsumptionRepository;
import com.Protronserver.Protronserver.Repository.PORepository;
import com.Protronserver.Protronserver.Repository.POMilestoneRepository;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Service
public class POConsumptionService {

    @Autowired
    private POConsumptionRepository poConsumptionRepository;

    @Autowired
    private PORepository poRepository;

    @Autowired
    private POMilestoneRepository poMilestoneRepository;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    public POConsumption addPOConsumption(POConsumptionDTO dto) {
        // --- VALIDATION START ---

        // 1. Validate that the PO exists
        String poNumber = dto.getPoNumber();
        Long poId = poRepository.findPoIdByPoNumber(poNumber)
                .orElseThrow(() -> new RuntimeException("PO not found with number: " + poNumber));

        // 2. Get PO details for currency validation
        String poCurrency = poRepository.findPoCurrencyByPoNumber(poNumber)
                .orElseThrow(() -> new RuntimeException("PO currency not found for PO number: " + poNumber));

        // 3. Validate currency matches PO currency
        if (!poCurrency.equalsIgnoreCase(dto.getCurrency())) {
            throw new IllegalArgumentException("Consumption currency (" + dto.getCurrency() +
                    ") does not match PO currency (" + poCurrency + ").");
        }

        // 4. Check if milestone exists for this PO (if msName is provided)
        boolean hasMilestones = false;
        if (dto.getMsId() != null) {
            // Check if milestone exists for this PO
            boolean milestoneExists = poMilestoneRepository.existsByPoDetail_PoNumberAndMsId(poNumber,
                    dto.getMsId());
            if (!milestoneExists) {
                throw new IllegalArgumentException("Milestone '" + dto.getMsId() + "' not found for PO: " + poNumber);
            }
            hasMilestones = true;
        } else {
            // Check if PO has any milestones
            long milestoneCount = poMilestoneRepository.countByPoDetail_PoNumber(poNumber);
            hasMilestones = milestoneCount > 0;
        }

        BigDecimal newConsumptionAmount = new BigDecimal(dto.getAmount());

        if (hasMilestones && dto.getMsId() != null) {
            // Case A: PO has milestones and milestone is specified
            // Check against milestone balance
            Integer milestoneAmountInt = poMilestoneRepository.findAmountByPoIdAndMsId(poId, dto.getMsId())
                    .orElseThrow(() -> new RuntimeException("Milestone amount not found"));

            BigDecimal milestoneAmount = new BigDecimal(milestoneAmountInt);
            BigDecimal existingConsumption = poConsumptionRepository.sumConsumptionAmountsByPoNumberAndMsId(poNumber,
                    dto.getMsId());

            if (existingConsumption.add(newConsumptionAmount).compareTo(milestoneAmount) > 0) {
                BigDecimal availableBalance = milestoneAmount.subtract(existingConsumption);
                throw new IllegalArgumentException("Consumption amount exceeds milestone balance. " +
                        "Available milestone balance: " + availableBalance);
            }
        } else {
            // Case B: PO has no milestones OR milestone not specified
            // Check against PO balance
            BigDecimal poAmount = poRepository.findPoAmountByPoNumber(poNumber)
                    .orElseThrow(() -> new RuntimeException("PO amount not found"));

            BigDecimal existingConsumption = poConsumptionRepository.sumConsumptionAmountsByPoNumber(poNumber);

            if (existingConsumption.add(newConsumptionAmount).compareTo(poAmount) > 0) {
                BigDecimal availableBalance = poAmount.subtract(existingConsumption);
                throw new IllegalArgumentException("Consumption amount exceeds PO balance. " +
                        "Available PO balance: " + availableBalance);
            }
        }

        // --- VALIDATION END ---

        // Create and populate the entity
        POConsumption consumption = new POConsumption();
        consumption.setPoNumber(dto.getPoNumber());
        POMilestone milestone = poMilestoneRepository
                .findByPoNumberAndMsId(poNumber, dto.getMsId())
                .orElseThrow(() -> new RuntimeException("Milestone not found"));

        consumption.setMilestone(milestone);
        consumption.setAmount(dto.getAmount());
        consumption.setCurrency(dto.getCurrency());
        consumption.setUtilizationType(dto.getUtilizationType());
        consumption.setResourceOrProject(dto.getResourceOrProject());
        consumption.setWorkDesc(dto.getWorkDesc());
        consumption.setWorkAssignDate(dto.getWorkAssignDate());
        consumption.setWorkCompletionDate(dto.getWorkCompletionDate());
        consumption.setRemarks(dto.getRemarks());
        consumption.setSystemName(dto.getSystemName());
        consumption.setUpdatedBy(null);
        consumption.setCreatedTimestamp(LocalDateTime.now());
        consumption.setLastUpdateTimestamp(null);

        return poConsumptionRepository.save(consumption);
    }

    public POConsumption updatePOConsumption(Long utilizationId, POConsumptionDTO dto) {
        // 1. Fetch existing consumption
        POConsumption existingConsumption = poConsumptionRepository.findById(utilizationId)
                .orElseThrow(() -> new RuntimeException("PO Consumption not found with ID: " + utilizationId));

        // 2. Validate PO existence
        String poNumber = dto.getPoNumber();
        Long poId = poRepository.findPoIdByPoNumber(poNumber)
                .orElseThrow(() -> new RuntimeException("PO not found with number: " + poNumber));

        // 3. Get PO currency for validation
        String poCurrency = poRepository.findPoCurrencyByPoNumber(poNumber)
                .orElseThrow(() -> new RuntimeException("PO currency not found for PO number: " + poNumber));

        // 4. Currency validation
        if (!poCurrency.equalsIgnoreCase(dto.getCurrency())) {
            throw new IllegalArgumentException("Consumption currency (" + dto.getCurrency() +
                    ") does not match PO currency (" + poCurrency + ").");
        }

        // 5. Check milestone existence and validation type
        boolean hasMilestones = false;
        if (dto.getMsId() != null) {
            boolean milestoneExists = poMilestoneRepository.existsByPoDetail_PoNumberAndMsId(poNumber, dto.getMsId());
            if (!milestoneExists) {
                throw new IllegalArgumentException("Milestone '" + dto.getMsId() + "' not found for PO: " + poNumber);
            }
            hasMilestones = true;
        } else {
            long milestoneCount = poMilestoneRepository.countByPoDetail_PoNumber(poNumber);
            hasMilestones = milestoneCount > 0;
        }

        BigDecimal newConsumptionAmount = new BigDecimal(dto.getAmount());

        if (hasMilestones && dto.getMsId() != null) {
            // Milestone-based validation
            Integer milestoneAmountInt = poMilestoneRepository.findAmountByPoIdAndMsId(poId, dto.getMsId())
                    .orElseThrow(() -> new RuntimeException("Milestone amount not found"));

            BigDecimal milestoneAmount = new BigDecimal(milestoneAmountInt);
            BigDecimal existingConsumptionExcludingCurrent = poConsumptionRepository
                    .sumConsumptionAmountsByPoNumberAndMsNameExcludingId(poNumber, dto.getMsId(), utilizationId);

            if (existingConsumptionExcludingCurrent.add(newConsumptionAmount).compareTo(milestoneAmount) > 0) {
                BigDecimal availableBalance = milestoneAmount.subtract(existingConsumptionExcludingCurrent);
                throw new IllegalArgumentException("Updated consumption amount exceeds milestone balance. " +
                        "Available milestone balance: " + availableBalance);
            }
        } else {
            // PO-based validation
            BigDecimal poAmount = poRepository.findPoAmountByPoNumber(poNumber)
                    .orElseThrow(() -> new RuntimeException("PO amount not found"));

            BigDecimal existingConsumptionExcludingCurrent = poConsumptionRepository
                    .sumConsumptionAmountsByPoNumberExcludingId(poNumber, utilizationId);

            if (existingConsumptionExcludingCurrent.add(newConsumptionAmount).compareTo(poAmount) > 0) {
                BigDecimal availableBalance = poAmount.subtract(existingConsumptionExcludingCurrent);
                throw new IllegalArgumentException("Updated consumption amount exceeds PO balance. " +
                        "Available PO balance: " + availableBalance);
            }
        }

        // --- VERSIONING: Mark old version as ended ---
        existingConsumption.setLastUpdateTimestamp(LocalDateTime.now());
        existingConsumption.setUpdatedBy(loggedInUserUtils.getLoggedInUser().getEmail());
        poConsumptionRepository.save(existingConsumption);

        // --- Create new version ---
        POConsumption newConsumption = new POConsumption();
        newConsumption.setPoNumber(dto.getPoNumber());

        if (dto.getMsId() != null) {
            POMilestone milestone = poMilestoneRepository
                    .findByPoNumberAndMsId(poNumber, dto.getMsId())
                    .orElseThrow(() -> new RuntimeException("Milestone not found"));
            newConsumption.setMilestone(milestone);
        } else {
            newConsumption.setMilestone(null);
        }

        newConsumption.setAmount(dto.getAmount());
        newConsumption.setCurrency(dto.getCurrency());
        newConsumption.setUtilizationType(dto.getUtilizationType());
        newConsumption.setResourceOrProject(dto.getResourceOrProject());
        newConsumption.setWorkDesc(dto.getWorkDesc());
        newConsumption.setWorkAssignDate(dto.getWorkAssignDate());
        newConsumption.setWorkCompletionDate(dto.getWorkCompletionDate());
        newConsumption.setRemarks(dto.getRemarks());
        newConsumption.setSystemName(dto.getSystemName());

        // Versioning fields
        newConsumption.setCreatedTimestamp(LocalDateTime.now());
        newConsumption.setLastUpdateTimestamp(null);
        newConsumption.setUpdatedBy(null);

        return poConsumptionRepository.save(newConsumption);
    }


    public List<POConsumption> getAllPOConsumptions() {
        return poConsumptionRepository.findAllActive();
    }

    public POConsumption getPOConsumptionById(Long utilizationId) {
        return poConsumptionRepository.findById(utilizationId)
                .orElseThrow(() -> new RuntimeException("PO Consumption not found with ID: " + utilizationId));
    }

    public List<POConsumption> getPOConsumptionsByPoNumber(String poNumber) {
        return poConsumptionRepository.findByPoNumber(poNumber);
    }

    public List<POConsumption> getPOConsumptionsByPoNumberAndMilestone(String poNumber, String msName) {
        return poConsumptionRepository.findByPoNumberAndMilestone_MsName(poNumber, msName);
    }

    /**
     * Calculate remaining balance for PO consumption
     */
    public BigDecimal getPOConsumptionBalance(String poNumber, Long msId) {
        // Check if milestone is specified and exists
        if (msId != null) {
            Long poId = poRepository.findPoIdByPoNumber(poNumber)
                    .orElseThrow(() -> new RuntimeException("PO not found with number: " + poNumber));

            Integer milestoneAmountInt = poMilestoneRepository.findAmountByPoIdAndMsId(poId, msId)
                    .orElseThrow(() -> new RuntimeException("Milestone not found"));

            BigDecimal milestoneAmount = new BigDecimal(milestoneAmountInt);
            BigDecimal totalConsumption = poConsumptionRepository.sumConsumptionAmountsByPoNumberAndMsId(poNumber,
                    msId);

            return milestoneAmount.subtract(totalConsumption);
        } else {
            // PO level balance
            BigDecimal poAmount = poRepository.findPoAmountByPoNumber(poNumber)
                    .orElseThrow(() -> new RuntimeException("PO amount not found"));

            BigDecimal totalConsumption = poConsumptionRepository.sumConsumptionAmountsByPoNumber(poNumber);

            return poAmount.subtract(totalConsumption);
        }
    }

    /**
     * Delete PO consumption by ID
     */
    public void deletePOConsumption(Long utilizationId) {
        POConsumption consumption = poConsumptionRepository.findById(utilizationId)
                .orElseThrow(() -> new RuntimeException("PO Consumption not found with ID: " + utilizationId));

        consumption.setLastUpdateTimestamp(LocalDateTime.now());
        consumption.setUpdatedBy(loggedInUserUtils.getLoggedInUser().getEmail());

        poConsumptionRepository.save(consumption);
    }
}