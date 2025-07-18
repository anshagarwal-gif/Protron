package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.SRNDTO;
import com.Protronserver.Protronserver.Entities.PODetails;
import com.Protronserver.Protronserver.Entities.SRNDetails;
import com.Protronserver.Protronserver.Repository.PORepository;
import com.Protronserver.Protronserver.Repository.SRNRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class SRNService {

    @Autowired
    private SRNRepository srnRepository;

    @Autowired
    private PORepository poDetailsRepository;

    public SRNDetails addSRN(SRNDTO dto) {
        // Validate PO exists
        Optional<PODetails> poDetails = poDetailsRepository.findById(dto.getPoId());
        if (!poDetails.isPresent()) {
            throw new RuntimeException("PO not found with ID: " + dto.getPoId());
        }

        SRNDetails srnDetails = new SRNDetails();
        srnDetails.setPoDetail(poDetails.get());
        srnDetails.setPoNumber(dto.getPoNumber());
        srnDetails.setMsName(dto.getMsName());
        srnDetails.setSrnName(dto.getSrnName());
        srnDetails.setSrnDsc(dto.getSrnDsc());
        srnDetails.setSrnAmount(dto.getSrnAmount());
        srnDetails.setSrnCurrency(dto.getSrnCurrency());
        srnDetails.setSrnRemarks(dto.getSrnRemarks());
        // srnDetails.setCreatedTimestamp(new Date());
        // srnDetails.setLastUpdateTimestamp(new Date());
        // srnDetails.setUpdatedBy(dto.getUpdatedBy());

        return srnRepository.save(srnDetails);
    }

    public SRNDetails updateSRN(Long srnId, SRNDTO dto) {
        Optional<SRNDetails> existingSRN = srnRepository.findById(srnId);
        if (!existingSRN.isPresent()) {
            throw new RuntimeException("SRN not found with ID: " + srnId);
        }

        SRNDetails srnDetails = existingSRN.get();

        // Update PO if changed
        if (dto.getPoId() != null && !dto.getPoId().equals(srnDetails.getPoDetail().getPoId())) {
            Optional<PODetails> poDetails = poDetailsRepository.findById(dto.getPoId());
            if (!poDetails.isPresent()) {
                throw new RuntimeException("PO not found with ID: " + dto.getPoId());
            }
            srnDetails.setPoDetail(poDetails.get());
        }

        // Update other fields
        if (dto.getPoNumber() != null)
            srnDetails.setPoNumber(dto.getPoNumber());
        if (dto.getMsName() != null)
            srnDetails.setMsName(dto.getMsName());
        if (dto.getSrnName() != null)
            srnDetails.setSrnName(dto.getSrnName());
        if (dto.getSrnDsc() != null)
            srnDetails.setSrnDsc(dto.getSrnDsc());
        if (dto.getSrnAmount() != null)
            srnDetails.setSrnAmount(dto.getSrnAmount());
        if (dto.getSrnCurrency() != null)
            srnDetails.setSrnCurrency(dto.getSrnCurrency());
        if (dto.getSrnRemarks() != null)
            srnDetails.setSrnRemarks(dto.getSrnRemarks());

        srnDetails.setLastUpdateTimestamp(new Date());

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