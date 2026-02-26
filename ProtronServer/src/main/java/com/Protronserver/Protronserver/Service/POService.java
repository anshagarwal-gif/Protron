package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.PODetailsDTO;
import com.Protronserver.Protronserver.Entities.*;
import com.Protronserver.Protronserver.Repository.*;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class POService {

    @Autowired
    private PORepository poRepository;

    @Autowired
    private POMilestoneRepository poMilestoneRepository;

    @Autowired
    private SRNRepository srnRepository;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    @Autowired
    private POConsumptionRepository poConsumptionRepository;

    @Autowired
    private POAttachmentRepository poAttachmentRepository;

    public PODetails addPO(PODetailsDTO dto) {

        Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();

        if (poRepository.existsByPoNumberAndTenantId(dto.getPoNumber(), tenantId)) {
            throw new IllegalArgumentException("PO Number already exists");
        }

        PODetails po = new PODetails();

        po.setPoNumber(dto.getPoNumber());
        po.setPoType(PODetails.POType.valueOf(dto.getPoType()));
        po.setPoDesc(dto.getPoDesc());
        po.setPoAmount(dto.getPoAmount());
        po.setPoCurrency(dto.getPoCurrency());
        po.setPoSpoc(dto.getPoSpoc());
        po.setSupplier(dto.getSupplier());
        po.setCustomer(dto.getCustomer());
        po.setSponsorName(dto.getSponsorName());
        po.setSponsorLob(dto.getSponsorLob());
        po.setBudgetLineItem(dto.getBudgetLineItem());
        po.setBudgetLineAmount(dto.getBudgetLineAmount());
        po.setBudgetLineRemarks(dto.getBudgetLineRemarks());
        po.setBusinessValueAmount(dto.getBusinessValueAmount());
        po.setBusinessValueType(dto.getBusinessValueType());
        po.setPoCountry(dto.getPoCountry());
        po.setProjectName(dto.getProjectName());
        po.setPoStartDate(dto.getPoStartDate());
        po.setPoEndDate(dto.getPoEndDate());

        User loggedInUser = loggedInUserUtils.getLoggedInUser();
        po.setTenantId(loggedInUser.getTenant().getTenantId());

        po.setCreateTimestamp(LocalDateTime.now());
        po.setEndTimestamp(null);
        po.setLastUpdateBy(null);

        return poRepository.save(po);
    }

    @Transactional
    public PODetails updatePO(Long id, PODetailsDTO dto) {

        Long currentTenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();

        PODetails oldPo = poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PO not found with ID: " + id));

        if ( !oldPo.getPoNumber().equals(dto.getPoNumber()) && poRepository.existsByPoNumberAndTenantId(dto.getPoNumber(), currentTenantId)) {
            throw new IllegalArgumentException("PO Number already exists");
        }

        // --- VALIDATION START ---
        if (dto.getPoCurrency() != null && !dto.getPoCurrency().equalsIgnoreCase(oldPo.getPoCurrency())) {
            String newCurrency = dto.getPoCurrency();

            // 1. Update currency in active milestones
            List<POMilestone> activeMilestones = poMilestoneRepository.findByPoDetail_PoId(oldPo.getPoId(), currentTenantId);
            for (POMilestone ms : activeMilestones) {
                ms.setMsCurrency(newCurrency);
                poMilestoneRepository.save(ms);
            }

            // 2. Update currency in active POConsumption
            List<POConsumption> activeConsumptions = poConsumptionRepository.findByPoNumber(oldPo.getPoNumber(), currentTenantId);
            for (POConsumption con : activeConsumptions) {
                con.setCurrency(newCurrency);
                poConsumptionRepository.save(con);
            }

            // 3. Update currency in active SRNs
            List<SRNDetails> activeSrns = srnRepository.findByPoIdWithoutMs(oldPo.getPoId(), currentTenantId);
            for (SRNDetails srn : activeSrns) {
                srn.setSrnCurrency(newCurrency);
                srnRepository.save(srn);
            }
        }

        if (dto.getPoAmount() != null) {
            BigDecimal newPoAmount = dto.getPoAmount();
            long milestoneCount = poMilestoneRepository.countByPoId(id, currentTenantId);

            if (milestoneCount > 0) {
                BigDecimal totalMilestoneAmount = poMilestoneRepository.sumMilestoneAmountsByPoId(id, currentTenantId);
                if (newPoAmount.compareTo(totalMilestoneAmount) < 0) {
                    throw new IllegalArgumentException("PO amount cannot be less than the total of its milestones. " +
                            "Current milestone total: " + totalMilestoneAmount);
                }
            } else {
                BigDecimal totalSrnAmount = srnRepository.sumSrnAmountsByPoId(id, currentTenantId);
                if (newPoAmount.compareTo(totalSrnAmount) < 0) {
                    throw new IllegalArgumentException("PO amount cannot be less than the total of its SRNs. " +
                            "Current SRN total: " + totalSrnAmount);
                }
            }
        }
        // --- VALIDATION END ---

        String updatedBy = loggedInUserUtils.getLoggedInUser().getEmail();

        // 1. Mark old PO as inactive
        oldPo.setEndTimestamp(LocalDateTime.now());
        oldPo.setLastUpdateBy(updatedBy);
        poRepository.save(oldPo);

        // 2. Create new PO
        PODetails newPo = new PODetails();
        newPo.setPoNumber(dto.getPoNumber());
        newPo.setPoType(PODetails.POType.valueOf(dto.getPoType()));
        newPo.setPoDesc(dto.getPoDesc());
        newPo.setPoAmount(dto.getPoAmount());
        newPo.setPoCurrency(dto.getPoCurrency());
        newPo.setPoSpoc(dto.getPoSpoc());
        newPo.setSupplier(dto.getSupplier());
        newPo.setCustomer(dto.getCustomer());
        newPo.setSponsorName(dto.getSponsorName());
        newPo.setSponsorLob(dto.getSponsorLob());
        newPo.setBudgetLineItem(dto.getBudgetLineItem());
        newPo.setBudgetLineAmount(dto.getBudgetLineAmount());
        newPo.setBudgetLineRemarks(dto.getBudgetLineRemarks());
        newPo.setBusinessValueAmount(dto.getBusinessValueAmount());
        newPo.setBusinessValueType(dto.getBusinessValueType());
        newPo.setPoCountry(dto.getPoCountry());
        newPo.setProjectName(dto.getProjectName());
        newPo.setPoStartDate(dto.getPoStartDate());
        newPo.setPoEndDate(dto.getPoEndDate());
        newPo.setCreateTimestamp(LocalDateTime.now());
        newPo.setTenantId(oldPo.getTenantId());
        newPo.setEndTimestamp(null);
        newPo.setLastUpdateBy(null);

        PODetails savedNewPo = poRepository.save(newPo);

        // 3. Update poDetail & poNumber in active milestones
        List<POMilestone> activeMilestones = poMilestoneRepository.findByPoDetail_PoId(oldPo.getPoId(), currentTenantId);
        for (POMilestone ms : activeMilestones) {
            ms.setPoDetail(savedNewPo);
            ms.setPoNumber(savedNewPo.getPoNumber());
            poMilestoneRepository.save(ms);
        }

        // 4. Update poNumber in active POConsumption
        List<POConsumption> activeConsumptions = poConsumptionRepository.findByPoNumber(oldPo.getPoNumber(), currentTenantId);
        for (POConsumption con : activeConsumptions) {
            con.setPoNumber(savedNewPo.getPoNumber());
            poConsumptionRepository.save(con);
        }

        // 5. Update poDetail & poNumber in active SRNs
        List<SRNDetails> activeSrns = srnRepository.findByPoIdWithoutMs(oldPo.getPoId(), currentTenantId);
        for (SRNDetails srn : activeSrns) {
            srn.setPoDetail(savedNewPo);
            srn.setPoNumber(savedNewPo.getPoNumber());
            srnRepository.save(srn);
        }

        poAttachmentRepository.updateReferenceId("PO", oldPo.getPoId(), savedNewPo.getPoId());

        return savedNewPo;
    }



    public List<PODetails> getAllPOs() {
        return poRepository.findAllActivePOs(loggedInUserUtils.getLoggedInUser().getTenant().getTenantId());
    }

    public PODetails getPOById(Long id) {
        PODetails po = poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PO not found with ID: " + id));

        if (po.getEndTimestamp() != null) {
            throw new RuntimeException("This PO is inactive (soft-deleted or updated).");
        }

        return po;
    }

    public PODetails getPOByPoNumber(String poNumber) {
        Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
        return poRepository.findByPoNumberAndTenantId(poNumber, tenantId)
                .orElseThrow(() -> new RuntimeException("PO not found with number: " + poNumber));
    }

    /** Resolve id or PO number (e.g. 123 or PO0345) to numeric poId for use in other services. */
    public Long resolvePoId(String idOrNumber) {
        if (idOrNumber == null || idOrNumber.isBlank()) {
            throw new IllegalArgumentException("PO id or number is required");
        }
        try {
            Long id = Long.parseLong(idOrNumber);
            getPOById(id);
            return id;
        } catch (NumberFormatException e) {
            return getPOByPoNumber(idOrNumber).getPoId();
        }
    }

}
