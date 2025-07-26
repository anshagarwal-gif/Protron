package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.PODetailsDTO;
import com.Protronserver.Protronserver.Entities.POConsumption;
import com.Protronserver.Protronserver.Entities.PODetails;
import com.Protronserver.Protronserver.Entities.POMilestone;
import com.Protronserver.Protronserver.Entities.SRNDetails;
import com.Protronserver.Protronserver.Repository.POConsumptionRepository;
import com.Protronserver.Protronserver.Repository.POMilestoneRepository;
import com.Protronserver.Protronserver.Repository.PORepository;
import com.Protronserver.Protronserver.Repository.SRNRepository;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
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

    public PODetails addPO(PODetailsDTO dto) {
        PODetails po = new PODetails();

        po.setPoNumber(dto.getPoNumber());
        po.setPoType(PODetails.POType.valueOf(dto.getPoType()));
        po.setPoDesc(dto.getPoDesc());
        po.setPoAmount(dto.getPoAmount());
        po.setPoCurrency(dto.getPoCurrency());
        po.setPoSpoc(dto.getPoSpoc());
        po.setSupplier(dto.getSupplier());
        po.setCustomer(dto.getCustomer());
        po.setProjectName(dto.getProjectName());
        po.setPoStartDate(dto.getPoStartDate());
        po.setPoEndDate(dto.getPoEndDate());

        po.setCreateTimestamp(LocalDateTime.now());
        po.setEndTimestamp(null);
        po.setLastUpdateBy(null);

        return poRepository.save(po);
    }

    public PODetails updatePO(Long id, PODetailsDTO dto) {
        PODetails oldPo = poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PO not found with ID: " + id));

        // --- VALIDATION START ---
        if (dto.getPoCurrency() != null && !dto.getPoCurrency().equalsIgnoreCase(oldPo.getPoCurrency())) {
            throw new IllegalArgumentException("PO currency cannot be changed.");
        }

        if (dto.getPoAmount() != null) {
            BigDecimal newPoAmount = dto.getPoAmount();
            long milestoneCount = poMilestoneRepository.countByPoId(id);

            if (milestoneCount > 0) {
                BigDecimal totalMilestoneAmount = poMilestoneRepository.sumMilestoneAmountsByPoId(id);
                if (newPoAmount.compareTo(totalMilestoneAmount) < 0) {
                    throw new IllegalArgumentException("PO amount cannot be less than the total of its milestones. " +
                            "Current milestone total: " + totalMilestoneAmount);
                }
            } else {
                BigDecimal totalSrnAmount = srnRepository.sumSrnAmountsByPoId(id);
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
        newPo.setProjectName(dto.getProjectName());
        newPo.setPoStartDate(dto.getPoStartDate());
        newPo.setPoEndDate(dto.getPoEndDate());
        newPo.setCreateTimestamp(LocalDateTime.now());
        newPo.setEndTimestamp(null);
        newPo.setLastUpdateBy(null);

        PODetails savedNewPo = poRepository.save(newPo);

        // 3. Update poDetail & poNumber in active milestones
        List<POMilestone> activeMilestones = poMilestoneRepository.findByPoDetail_PoId(oldPo.getPoId());
        for (POMilestone ms : activeMilestones) {
            ms.setPoDetail(savedNewPo);
            ms.setPoNumber(savedNewPo.getPoNumber());
            poMilestoneRepository.save(ms);
        }

        // 4. Update poNumber in active POConsumption
        List<POConsumption> activeConsumptions = poConsumptionRepository.findByPoNumber(oldPo.getPoNumber());
        for (POConsumption con : activeConsumptions) {
            con.setPoNumber(savedNewPo.getPoNumber());
            poConsumptionRepository.save(con);
        }

        // 5. Update poDetail & poNumber in active SRNs
        List<SRNDetails> activeSrns = srnRepository.findByPoIdWithoutMs(oldPo.getPoId());
        for (SRNDetails srn : activeSrns) {
            srn.setPoDetail(savedNewPo);
            srn.setPoNumber(savedNewPo.getPoNumber());
            srnRepository.save(srn);
        }

        return savedNewPo;
    }



    public List<PODetails> getAllPOs() {
        return poRepository.findAllActivePOs();
    }

    public PODetails getPOById(Long id) {
        PODetails po = poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PO not found with ID: " + id));

        if (po.getEndTimestamp() != null) {
            throw new RuntimeException("This PO is inactive (soft-deleted or updated).");
        }

        return po;
    }

}
