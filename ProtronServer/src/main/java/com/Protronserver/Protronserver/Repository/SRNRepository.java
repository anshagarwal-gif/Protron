package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.SRNDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface SRNRepository extends JpaRepository<SRNDetails, Long> {

    // Find SRNs by PO ID
    List<SRNDetails> findByPoDetail_PoId(Long poId);

    // Find SRNs by PO Number
    List<SRNDetails> findByPoNumber(String poNumber);

    // Find SRNs by Milestone Name
    List<SRNDetails> findByMilestone_MsName(String msName);

    // Find SRNs by SRN Name
    List<SRNDetails> findBySrnName(String srnName);

    @Query(value = "SELECT COALESCE(SUM(s.srn_amount), 0) FROM srn_details s WHERE s.po_id = :poId AND s.ms_id = :msId", nativeQuery = true)
    BigDecimal sumSrnAmountsByPoIdAndMsId(Long poId, Long msId);

    @Query(value = "SELECT COALESCE(SUM(srn_amount), 0) FROM srn_details WHERE po_id = :poId", nativeQuery = true)
    BigDecimal sumSrnAmountsByPoId(Long poId);
}