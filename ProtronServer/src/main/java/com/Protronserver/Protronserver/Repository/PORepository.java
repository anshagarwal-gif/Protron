package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.PODetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PORepository extends JpaRepository<PODetails, Long> {

    @Query(value = "SELECT po_amount FROM po_detail WHERE po_id = :poId", nativeQuery = true)
    Optional<BigDecimal> findPoAmountById(@Param("poId") Long poId);

    // PO ID by number — only active POs
    @Query("SELECT p.poId FROM PODetails p WHERE p.poNumber = :poNumber AND p.endTimestamp IS NULL")
    Optional<Long> findPoIdByPoNumber(@Param("poNumber") String poNumber);

    // Currency by PO number — only active POs
    @Query("SELECT p.poCurrency FROM PODetails p WHERE p.poNumber = :poNumber AND p.endTimestamp IS NULL")
    Optional<String> findPoCurrencyByPoNumber(@Param("poNumber") String poNumber);

    // PO Amount by PO number — only active POs
    @Query("SELECT p.poAmount FROM PODetails p WHERE p.poNumber = :poNumber AND p.endTimestamp IS NULL")
    Optional<BigDecimal> findPoAmountByPoNumber(@Param("poNumber") String poNumber);

    @Query("SELECT p FROM PODetails p WHERE p.endTimestamp IS NULL")
    List<PODetails> findAllActivePOs();

}
