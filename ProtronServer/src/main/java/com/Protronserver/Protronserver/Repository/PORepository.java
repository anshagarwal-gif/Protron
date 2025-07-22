package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.PODetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface PORepository extends JpaRepository<PODetails, Long> {

    @Query(value = "SELECT po_amount FROM po_detail WHERE po_id = :poId", nativeQuery = true)
    Optional<BigDecimal> findPoAmountById(Long poId);

    /**
     * Find PO ID by PO number
     */
    @Query("SELECT p.poId FROM PODetails p WHERE p.poNumber = :poNumber")
    Optional<Long> findPoIdByPoNumber(@Param("poNumber") String poNumber);

    /**
     * Find PO currency by PO number
     */
    @Query("SELECT p.poCurrency FROM PODetails p WHERE p.poNumber = :poNumber")
    Optional<String> findPoCurrencyByPoNumber(@Param("poNumber") String poNumber);

    /**
     * Find PO amount by PO number
     */
    @Query("SELECT p.poAmount FROM PODetails p WHERE p.poNumber = :poNumber")
    Optional<BigDecimal> findPoAmountByPoNumber(@Param("poNumber") String poNumber);

}
