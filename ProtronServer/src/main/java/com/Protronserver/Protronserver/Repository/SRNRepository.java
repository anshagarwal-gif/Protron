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

    @Query("SELECT s FROM SRNDetails s WHERE s.lastUpdateTimestamp IS NULL")
    List<SRNDetails> findAllActive();

    // Find SRNs by PO ID
    @Query("SELECT s FROM SRNDetails s WHERE s.poDetail.poId = :poId AND s.lastUpdateTimestamp IS NULL")
    List<SRNDetails> findByPoDetail_PoId(Long poId);

    // Find SRNs by PO Number
    @Query("SELECT s FROM SRNDetails s WHERE s.poNumber = :poNumber AND s.lastUpdateTimestamp IS NULL")
    List<SRNDetails> findByPoNumber(String poNumber);

    // Find SRNs by Milestone Name
    @Query("SELECT s FROM SRNDetails s WHERE s.milestone.msName = :msName AND s.lastUpdateTimestamp IS NULL")
    List<SRNDetails> findByMilestone_MsName(String msName);

    // Find SRNs by SRN Name
    @Query("SELECT s FROM SRNDetails s WHERE s.srnName = :srnName AND s.lastUpdateTimestamp IS NULL")
    List<SRNDetails> findBySrnName(String srnName);

    @Query(value = "SELECT COALESCE(SUM(s.srn_amount), 0) FROM srn_details s WHERE s.po_id = :poId AND s.ms_id = :msId AND s.lastupdate_timestamp IS NULL", nativeQuery = true)
    BigDecimal sumSrnAmountsByPoIdAndMsId(Long poId, Long msId);

    @Query(value = "SELECT COALESCE(SUM(s.srn_amount), 0) FROM srn_details s WHERE s.po_id = :poId AND s.lastupdate_timestamp IS NULL", nativeQuery = true)
    BigDecimal sumSrnAmountsByPoId(Long poId);
}