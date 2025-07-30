package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.SRNDTO;
import com.Protronserver.Protronserver.Entities.PODetails;
import com.Protronserver.Protronserver.Entities.SRNDetails;
import com.Protronserver.Protronserver.Entities.User;
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

    @Autowired
    private CostDetailsService costDetailsService;

    public SRNDetails addSRN(SRNDTO dto) {

        Long currentTenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();

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

        String srnType = dto.getSrnType().toLowerCase();

        if (dto.getMsId() != null) {
            // Milestone-level SRN
            Integer milestoneAmountInt = poMilestoneRepository.findAmountByPoIdAndMsId(poDetail.getPoId(), dto.getMsId(), currentTenantId)
                    .orElseThrow(() -> new RuntimeException("Milestone '" + dto.getMsId() + "' not found for this PO."));

            BigDecimal milestoneAmount = new BigDecimal(milestoneAmountInt);
            BigDecimal paidAmount = srnRepository.sumSrnAmountsByPoIdAndMsId(poDetail.getPoId(), dto.getMsId(), currentTenantId);

            if (srnType.equals("full")) {
                if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
                    throw new IllegalArgumentException("Full SRN not allowed: milestone already has SRNs.");
                }
                if (newSrnAmount.compareTo(milestoneAmount) != 0) {
                    throw new IllegalArgumentException("SRN amount must match milestone amount for full SRN.");
                }
            } else {
                BigDecimal remaining = milestoneAmount.subtract(paidAmount);
                if (newSrnAmount.compareTo(remaining) > 0) {
                    throw new IllegalArgumentException("Partial SRN exceeds remaining milestone balance: " + remaining);
                }
            }
        } else {
            // PO-level SRN
            if (costDetailsService.getRemainingMilestones(poDetail.getPoId()).size() > 0) {
                throw new IllegalArgumentException("PO has milestones. SRN must be against a milestone.");
            }

            BigDecimal totalPaidForPO = srnRepository.sumSrnAmountsByPoId(poDetail.getPoId(), currentTenantId);

            if (srnType.equals("full")) {
                if (totalPaidForPO.compareTo(BigDecimal.ZERO) > 0) {
                    throw new IllegalArgumentException("Full SRN not allowed: PO already has SRNs.");
                }
                if (newSrnAmount.compareTo(poDetail.getPoAmount()) != 0) {
                    throw new IllegalArgumentException("SRN amount must match PO amount for full SRN.");
                }
            } else {
                BigDecimal poBalance = poDetail.getPoAmount().subtract(totalPaidForPO);
                if (newSrnAmount.compareTo(poBalance) > 0) {
                    throw new IllegalArgumentException("Partial SRN exceeds remaining PO balance: " + poBalance);
                }
            }
        }


        // --- VALIDATION END ---

        // 3. If validations pass, create and save the SRN
        SRNDetails srnDetails = new SRNDetails();
        srnDetails.setPoDetail(poDetail);
        srnDetails.setPoNumber(poDetail.getPoNumber());
        if (dto.getMsId() != null) {
            srnDetails.setMilestone(poMilestoneRepository.findById(dto.getMsId())
                    .orElseThrow(() -> new RuntimeException("Milestone not found with ID: " + dto.getMsId())));
        }else{
            srnDetails.setMilestone(null);
        }
        srnDetails.setSrnName(dto.getSrnName());
        srnDetails.setSrnDsc(dto.getSrnDsc());
        srnDetails.setSrnType(dto.getSrnType());
        srnDetails.setSrnAmount(dto.getSrnAmount());
        srnDetails.setSrnCurrency(dto.getSrnCurrency());
        srnDetails.setSrnRemarks(dto.getSrnRemarks());

        User loggedInUser = loggedInUserUtils.getLoggedInUser();
        srnDetails.setTenantId(loggedInUser.getTenant().getTenantId());

        srnDetails.setCreatedTimestamp(LocalDateTime.now());
        srnDetails.setLastUpdateTimestamp(null);
        srnDetails.setUpdatedBy(null);

        return srnRepository.save(srnDetails);
    }

    public SRNDetails updateSRN(Long srnId, SRNDTO dto) {

        Long currentTenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();

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

        String srnType = dto.getSrnType().toLowerCase();

        Long milestoneId = (dto.getMsId() != null)
                ? dto.getMsId()
                : (existingSRN.getMilestone() != null ? existingSRN.getMilestone().getMsId() : null);

        if (milestoneId != null) {
            // Milestone-level update
            Integer milestoneAmountInt = poMilestoneRepository.findAmountByPoIdAndMsId(poDetail.getPoId(), milestoneId, currentTenantId)
                    .orElseThrow(() -> new RuntimeException("Milestone '" + milestoneId + "' not found for this PO."));

            BigDecimal milestoneAmount = new BigDecimal(milestoneAmountInt);
            BigDecimal currentPaidAmount = srnRepository.sumSrnAmountsByPoIdAndMsId(poDetail.getPoId(), milestoneId, currentTenantId);
            BigDecimal availableBalance = milestoneAmount.subtract(currentPaidAmount).add(originalSrnAmount);

            if (srnType.equals("full")) {
                // Ensure this is the ONLY SRN for the milestone
                List<SRNDetails> srns = srnRepository.findByPoIdAndMsId(poDetail.getPoId(), milestoneId, currentTenantId);
                if (srns.size() > 1 || (srns.size() == 1 && !srns.get(0).getSrnId().equals(existingSRN.getSrnId()))) {
                    throw new IllegalArgumentException("Full SRN not allowed: milestone already has other SRNs.");
                }
                if (newSrnAmount.compareTo(milestoneAmount) != 0) {
                    throw new IllegalArgumentException("Full SRN must equal milestone amount.");
                }
            } else {
                if (newSrnAmount.compareTo(availableBalance) > 0) {
                    throw new IllegalArgumentException("Partial SRN exceeds remaining milestone balance: " + availableBalance);
                }
            }

        } else {
            // PO-level update
            if (poMilestoneRepository.countByPoId(poDetail.getPoId(), currentTenantId) > 0) {
                throw new IllegalArgumentException("PO has milestones. SRN must be against a milestone.");
            }

            BigDecimal totalPaidForPO = srnRepository.sumSrnAmountsByPoId(poDetail.getPoId(), currentTenantId);
            BigDecimal availableBalance = poDetail.getPoAmount().subtract(totalPaidForPO).add(originalSrnAmount);

            if (srnType.equals("full")) {
                // Ensure this is the ONLY SRN for the PO
                List<SRNDetails> srns = srnRepository.findByPoIdWithoutMs(poDetail.getPoId(), currentTenantId);
                if (srns.size() > 1 || (srns.size() == 1 && !srns.get(0).getSrnId().equals(existingSRN.getSrnId()))) {
                    throw new IllegalArgumentException("Full SRN not allowed: PO already has other SRNs.");
                }
                if (newSrnAmount.compareTo(poDetail.getPoAmount()) != 0) {
                    throw new IllegalArgumentException("Full SRN must equal PO amount.");
                }
            } else {
                if (newSrnAmount.compareTo(availableBalance) > 0) {
                    throw new IllegalArgumentException("Partial SRN exceeds remaining PO balance: " + availableBalance);
                }
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
        }else{
            newSRN.setMilestone(null);
        }

        newSRN.setSrnName(dto.getSrnName());
        newSRN.setSrnDsc(dto.getSrnDsc());
        newSRN.setSrnType(dto.getSrnType());
        newSRN.setSrnAmount(dto.getSrnAmount());
        newSRN.setSrnCurrency(dto.getSrnCurrency());
        newSRN.setSrnRemarks(dto.getSrnRemarks());
        newSRN.setTenantId(existingSRN.getTenantId());
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
        return srnRepository.findAllActive(loggedInUserUtils.getLoggedInUser().getTenant().getTenantId());
    }

    public List<SRNDetails> getSRNsByPoId(Long poId) {
        return srnRepository.findByPoDetail_PoId(poId, loggedInUserUtils.getLoggedInUser().getTenant().getTenantId());
    }

    public List<SRNDetails> getSRNsByPoNumber(String poNumber) {
        return srnRepository.findByPoNumber(poNumber, loggedInUserUtils.getLoggedInUser().getTenant().getTenantId());
    }

    public List<SRNDetails> getSRNsByMilestoneName(String msName) {
        return srnRepository.findByMilestone_MsName(msName, loggedInUserUtils.getLoggedInUser().getTenant().getTenantId());
    }

    public void deleteSRN(Long srnId) {
        SRNDetails srn = srnRepository.findById(srnId)
                .orElseThrow(() -> new RuntimeException("SRN not found with ID: " + srnId));

        srn.setLastUpdateTimestamp(LocalDateTime.now());
        srn.setUpdatedBy(loggedInUserUtils.getLoggedInUser().getEmail());

        srnRepository.save(srn);
    }


    public Integer getTotalSRNAmountByPoId(Long poId) {
        List<SRNDetails> srnList = srnRepository.findByPoDetail_PoId(poId, loggedInUserUtils.getLoggedInUser().getTenant().getTenantId());
        return srnList.stream()
                .mapToInt(srn -> srn.getSrnAmount() != null ? srn.getSrnAmount() : 0)
                .sum();
    }

    public boolean checkExistingSRNs(Long poId, Long msId) {
        if (msId != null) {
            // Check for milestone-level SRNs
            List<SRNDetails> srns = srnRepository.findByPoIdAndMsId(poId, msId, loggedInUserUtils.getLoggedInUser().getTenant().getTenantId());
            return !srns.isEmpty();
        } else {
            // Check for PO-level SRNs
            List<SRNDetails> srns = srnRepository.findByPoIdWithoutMs(poId, loggedInUserUtils.getLoggedInUser().getTenant().getTenantId());
            return !srns.isEmpty();
        }
    }

    public BigDecimal getTotalSRNAmount(Long poId, Long msId) {
        if (msId != null) {
            // Fetch total SRN amount for a milestone
            return srnRepository.sumSrnAmountsByPoIdAndMsId(poId, msId, loggedInUserUtils.getLoggedInUser().getTenant().getTenantId());
        } else {
            // Fetch total SRN amount for a PO
            return srnRepository.sumSrnAmountsByPoId(poId, loggedInUserUtils.getLoggedInUser().getTenant().getTenantId());
        }
    }
}