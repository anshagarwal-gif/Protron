package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.SRNDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SRNRepository extends JpaRepository<SRNDetails, Long> {

    // Find SRNs by PO ID
    List<SRNDetails> findByPoDetail_PoId(Long poId);

    // Find SRNs by PO Number
    List<SRNDetails> findByPoNumber(String poNumber);

    // Find SRNs by Milestone Name
    List<SRNDetails> findByMsName(String msName);

    // Find SRNs by SRN Name
    List<SRNDetails> findBySrnName(String srnName);

    // Custom query to find SRNs with amount greater than specified value
    @Query("SELECT s FROM SRNDetails s WHERE s.srnAmount > :amount")
    List<SRNDetails> findSRNsWithAmountGreaterThan(@Param("amount") Integer amount);

    // Custom query to get total amount by PO ID
    @Query("SELECT COALESCE(SUM(s.srnAmount), 0) FROM SRNDetails s WHERE s.poDetail.poId = :poId")
    Integer getTotalAmountByPoId(@Param("poId") Long poId);

    // Find SRNs by currency
    List<SRNDetails> findBySrnCurrency(String currency);

    // Find SRNs containing specific text in remarks
    List<SRNDetails> findBySrnRemarksContainingIgnoreCase(String remarks);
}