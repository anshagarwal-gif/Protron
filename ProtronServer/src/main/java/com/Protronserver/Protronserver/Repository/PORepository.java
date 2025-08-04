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

    boolean existsByPoNumberAndTenantId(String poNumber, Long tenantId);

    // 1. Native query — also needs tenant check
    @Query(value = "SELECT po_amount FROM po_detail WHERE po_id = :poId AND tenant_id = :tenantId", nativeQuery = true)
    Optional<BigDecimal> findPoAmountById(@Param("poId") Long poId, @Param("tenantId") Long tenantId);

    // 2. PO ID by number (only active POs)
    @Query("SELECT p.poId FROM PODetails p WHERE p.poNumber = :poNumber AND p.tenantId = :tenantId AND p.endTimestamp IS NULL")
    Optional<Long> findPoIdByPoNumber(@Param("poNumber") String poNumber, @Param("tenantId") Long tenantId);

    // 3. Currency by PO number (only active POs)
    @Query("SELECT p.poCurrency FROM PODetails p WHERE p.poNumber = :poNumber AND p.tenantId = :tenantId AND p.endTimestamp IS NULL")
    Optional<String> findPoCurrencyByPoNumber(@Param("poNumber") String poNumber, @Param("tenantId") Long tenantId);

    // 4. PO Amount by PO number (only active POs)
    @Query("SELECT p.poAmount FROM PODetails p WHERE p.poNumber = :poNumber AND p.tenantId = :tenantId AND p.endTimestamp IS NULL")
    Optional<BigDecimal> findPoAmountByPoNumber(@Param("poNumber") String poNumber, @Param("tenantId") Long tenantId);

    // 5. All Active POs for a tenant
    @Query("SELECT p FROM PODetails p WHERE p.tenantId = :tenantId AND p.endTimestamp IS NULL")
    List<PODetails> findAllActivePOs(@Param("tenantId") Long tenantId);
}
