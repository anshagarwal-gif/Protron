package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.PODetailsDTO;
import com.Protronserver.Protronserver.Entities.PODetails;
import com.Protronserver.Protronserver.Repository.PORepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class POService {

    @Autowired
    private PORepository poRepository;

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
        Optional<PODetails> existingPO = poRepository.findById(id);
        if (existingPO.isPresent()) {
            PODetails po = existingPO.get();

            // Updating fields from DTO
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
        } else {
            throw new RuntimeException("PO not found with ID: " + id);
        }
    }

    public List<PODetails> getAllPOs() {
        return poRepository.findAll();
    }

    public PODetails getPOById(Long id) {
        return poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PO not found with ID: " + id));
    }

}
