package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.POConsumptionDTO;
import com.Protronserver.Protronserver.Entities.POConsumption;
import com.Protronserver.Protronserver.Repository.POConsumptionRepository;
import com.Protronserver.Protronserver.Repository.PORepository;
import com.Protronserver.Protronserver.Repository.POMilestoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
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
        if (dto.getMsName() != null && !dto.getMsName().trim().isEmpty()) {
            // Check if milestone exists for this PO
            boolean milestoneExists = poMilestoneRepository.existsByPoDetail_PoNumberAndMsName(poNumber,
                    dto.getMsName());
            if (!milestoneExists) {
                throw new IllegalArgumentException("Milestone '" + dto.getMsName() + "' not found for PO: " + poNumber);
            }
            hasMilestones = true;
        } else {
            // Check if PO has any milestones
            long milestoneCount = poMilestoneRepository.countByPoDetail_PoNumber(poNumber);
            hasMilestones = milestoneCount > 0;
        }

        BigDecimal newConsumptionAmount = new BigDecimal(dto.getAmount());

        if (hasMilestones && dto.getMsName() != null && !dto.getMsName().trim().isEmpty()) {
            // Case A: PO has milestones and milestone is specified
            // Check against milestone balance
            Integer milestoneAmountInt = poMilestoneRepository.findAmountByPoIdAndMsName(poId, dto.getMsName())
                    .orElseThrow(() -> new RuntimeException("Milestone amount not found"));

            BigDecimal milestoneAmount = new BigDecimal(milestoneAmountInt);
            BigDecimal existingConsumption = poConsumptionRepository.sumConsumptionAmountsByPoNumberAndMsName(poNumber,
                    dto.getMsName());

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
        consumption.setMsName(dto.getMsName());
        consumption.setAmount(dto.getAmount());
        consumption.setCurrency(dto.getCurrency());
        consumption.setUtilizationType(dto.getUtilizationType());
        consumption.setResourceOrProject(dto.getResourceOrProject());
        consumption.setWorkDesc(dto.getWorkDesc());
        consumption.setWorkAssignDate(dto.getWorkAssignDate());
        consumption.setWorkCompletionDate(dto.getWorkCompletionDate());
        consumption.setRemarks(dto.getRemarks());
        consumption.setSystemName(dto.getSystemName());
        consumption.setUpdatedBy(dto.getUpdatedBy());
        consumption.setCreatedTimestamp(new Date());
        consumption.setLastUpdateTimestamp(new Date());

        return poConsumptionRepository.save(consumption);
    }

    public POConsumption updatePOConsumption(Long utilizationId, POConsumptionDTO dto) {
        // 1. Fetch existing consumption
        POConsumption existingConsumption = poConsumptionRepository.findById(utilizationId)
                .orElseThrow(() -> new RuntimeException("PO Consumption not found with ID: " + utilizationId));

        // --- VALIDATION START ---

        // 2. Validate that the PO exists
        String poNumber = dto.getPoNumber();
        Long poId = poRepository.findPoIdByPoNumber(poNumber)
                .orElseThrow(() -> new RuntimeException("PO not found with number: " + poNumber));

        // 3. Get PO details for currency validation
        String poCurrency = poRepository.findPoCurrencyByPoNumber(poNumber)
                .orElseThrow(() -> new RuntimeException("PO currency not found for PO number: " + poNumber));

        // 4. Validate currency matches PO currency
        if (!poCurrency.equalsIgnoreCase(dto.getCurrency())) {
            throw new IllegalArgumentException("Consumption currency (" + dto.getCurrency() +
                    ") does not match PO currency (" + poCurrency + ").");
        }

        // 5. Check milestone existence and determine validation approach
        boolean hasMilestones = false;
        if (dto.getMsName() != null && !dto.getMsName().trim().isEmpty()) {
            boolean milestoneExists = poMilestoneRepository.existsByPoDetail_PoNumberAndMsName(poNumber,
                    dto.getMsName());
            if (!milestoneExists) {
                throw new IllegalArgumentException("Milestone '" + dto.getMsName() + "' not found for PO: " + poNumber);
            }
            hasMilestones = true;
        } else {
            long milestoneCount = poMilestoneRepository.countByPoDetail_PoNumber(poNumber);
            hasMilestones = milestoneCount > 0;
        }

        BigDecimal newConsumptionAmount = new BigDecimal(dto.getAmount());

        if (hasMilestones && dto.getMsName() != null && !dto.getMsName().trim().isEmpty()) {
            // Case A: Milestone-based validation
            Integer milestoneAmountInt = poMilestoneRepository.findAmountByPoIdAndMsName(poId, dto.getMsName())
                    .orElseThrow(() -> new RuntimeException("Milestone amount not found"));

            BigDecimal milestoneAmount = new BigDecimal(milestoneAmountInt);
            BigDecimal existingConsumptionExcludingCurrent = poConsumptionRepository
                    .sumConsumptionAmountsByPoNumberAndMsNameExcludingId(poNumber, dto.getMsName(), utilizationId);

            if (existingConsumptionExcludingCurrent.add(newConsumptionAmount).compareTo(milestoneAmount) > 0) {
                BigDecimal availableBalance = milestoneAmount.subtract(existingConsumptionExcludingCurrent);
                throw new IllegalArgumentException("Updated consumption amount exceeds milestone balance. " +
                        "Available milestone balance: " + availableBalance);
            }
        } else {
            // Case B: PO-based validation
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

        // --- VALIDATION END ---

        // Update the entity
        existingConsumption.setPoNumber(dto.getPoNumber());
        existingConsumption.setMsName(dto.getMsName());
        existingConsumption.setAmount(dto.getAmount());
        existingConsumption.setCurrency(dto.getCurrency());
        existingConsumption.setUtilizationType(dto.getUtilizationType());
        existingConsumption.setResourceOrProject(dto.getResourceOrProject());
        existingConsumption.setWorkDesc(dto.getWorkDesc());
        existingConsumption.setWorkAssignDate(dto.getWorkAssignDate());
        existingConsumption.setWorkCompletionDate(dto.getWorkCompletionDate());
        existingConsumption.setRemarks(dto.getRemarks());
        existingConsumption.setSystemName(dto.getSystemName());
        existingConsumption.setUpdatedBy(dto.getUpdatedBy());
        existingConsumption.setLastUpdateTimestamp(new Date());

        return poConsumptionRepository.save(existingConsumption);
    }

    public List<POConsumption> getAllPOConsumptions() {
        return poConsumptionRepository.findAll();
    }

    public POConsumption getPOConsumptionById(Long utilizationId) {
        return poConsumptionRepository.findById(utilizationId)
                .orElseThrow(() -> new RuntimeException("PO Consumption not found with ID: " + utilizationId));
    }

    public List<POConsumption> getPOConsumptionsByPoNumber(String poNumber) {
        return poConsumptionRepository.findByPoNumber(poNumber);
    }

    public List<POConsumption> getPOConsumptionsByPoNumberAndMilestone(String poNumber, String msName) {
        return poConsumptionRepository.findByPoNumberAndMsName(poNumber, msName);
    }

    /**
     * Calculate remaining balance for PO consumption
     */
    public BigDecimal getPOConsumptionBalance(String poNumber, String msName) {
        // Check if milestone is specified and exists
        if (msName != null && !msName.trim().isEmpty()) {
            Long poId = poRepository.findPoIdByPoNumber(poNumber)
                    .orElseThrow(() -> new RuntimeException("PO not found with number: " + poNumber));

            Integer milestoneAmountInt = poMilestoneRepository.findAmountByPoIdAndMsName(poId, msName)
                    .orElseThrow(() -> new RuntimeException("Milestone not found"));

            BigDecimal milestoneAmount = new BigDecimal(milestoneAmountInt);
            BigDecimal totalConsumption = poConsumptionRepository.sumConsumptionAmountsByPoNumberAndMsName(poNumber,
                    msName);

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

        poConsumptionRepository.delete(consumption);
    }
}