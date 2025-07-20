package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.PODetailsDTO;
import com.Protronserver.Protronserver.Entities.PODetails;
import com.Protronserver.Protronserver.Repository.POMilestoneRepository;
import com.Protronserver.Protronserver.Repository.PORepository;
import com.Protronserver.Protronserver.Repository.SRNRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class POService {

    @Autowired
    private PORepository poRepository;

    @Autowired
    private POMilestoneRepository poMilestoneRepository;

    @Autowired
    private SRNRepository srnRepository;

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

        return poRepository.save(po);
    }

    public PODetails updatePO(Long id, PODetailsDTO dto) {
        // 1. Fetch the existing PO from the database
        PODetails po = poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PO not found with ID: " + id));

        // --- VALIDATION START ---

        // Check 1: The PO currency cannot be changed.
        if (dto.getPoCurrency() != null && !dto.getPoCurrency().equalsIgnoreCase(po.getPoCurrency())) {
            throw new IllegalArgumentException("PO currency cannot be changed.");
        }

        // Check 2: The PO amount cannot be less than the amount already allocated.
        // We only perform this check if a new amount is actually provided in the DTO.
        if (dto.getPoAmount() != null) {
            BigDecimal newPoAmount = dto.getPoAmount();
            long milestoneCount = poMilestoneRepository.countByPoId(id);

            if (milestoneCount > 0) {
                // Case A: PO has milestones, so check against the sum of milestone amounts.
                BigDecimal totalMilestoneAmount = poMilestoneRepository.sumMilestoneAmountsByPoId(id);
                if (newPoAmount.compareTo(totalMilestoneAmount) < 0) {
                    throw new IllegalArgumentException("PO amount cannot be less than the total of its milestones. " +
                            "Current milestone total: " + totalMilestoneAmount);
                }
            } else {
                // Case B: PO has no milestones, so check against the sum of SRN amounts.
                BigDecimal totalSrnAmount = srnRepository.sumSrnAmountsByPoId(id);
                if (newPoAmount.compareTo(totalSrnAmount) < 0) {
                    throw new IllegalArgumentException("PO amount cannot be less than the total of its SRNs. " +
                            "Current SRN total: " + totalSrnAmount);
                }
            }
        }

        // --- VALIDATION END ---

        // 3. If validations pass, update the fields from the DTO
        po.setPoNumber(dto.getPoNumber());
        po.setPoType(PODetails.POType.valueOf(dto.getPoType()));
        po.setPoDesc(dto.getPoDesc());
        po.setPoAmount(dto.getPoAmount());
        // We don't update currency as per the check above, but keep this line if your DTO might have other valid uses for it
         po.setPoCurrency(dto.getPoCurrency());
        po.setPoSpoc(dto.getPoSpoc());
        po.setSupplier(dto.getSupplier());
        po.setCustomer(dto.getCustomer());
        po.setProjectName(dto.getProjectName());
        po.setPoStartDate(dto.getPoStartDate());
        po.setPoEndDate(dto.getPoEndDate());

        return poRepository.save(po);
    }

    public List<PODetails> getAllPOs() {
        return poRepository.findAll();
    }

    public PODetails getPOById(Long id) {
        return poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PO not found with ID: " + id));
    }

}
