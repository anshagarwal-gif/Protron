package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.DashboardRecords.PoVsInvoiceDTO;
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

    // 1. Get PO Amount by ID and tenant
    @Query(value = """
        SELECT po_amount 
        FROM po_detail 
        WHERE po_id = :poId AND tenant_id = :tenantId
    """, nativeQuery = true)
    Optional<BigDecimal> findPoAmountById(@Param("poId") Long poId, @Param("tenantId") Long tenantId);

    // 2. Get PO ID by number and tenant (active only)
    @Query(value = """
        SELECT po_id 
        FROM po_detail 
        WHERE po_number = :poNumber 
          AND tenant_id = :tenantId 
          AND end_timestamp IS NULL
    """, nativeQuery = true)
    Optional<Long> findPoIdByPoNumber(@Param("poNumber") String poNumber, @Param("tenantId") Long tenantId);

    // 3. Get Currency by PO number (active only)
    @Query(value = """
        SELECT po_currency 
        FROM po_detail 
        WHERE po_number = :poNumber 
          AND tenant_id = :tenantId 
          AND end_timestamp IS NULL
    """, nativeQuery = true)
    Optional<String> findPoCurrencyByPoNumber(@Param("poNumber") String poNumber, @Param("tenantId") Long tenantId);

    // 4. Get PO Amount by PO number (active only)
    @Query(value = """
        SELECT po_amount 
        FROM po_detail 
        WHERE po_number = :poNumber 
          AND tenant_id = :tenantId 
          AND end_timestamp IS NULL
    """, nativeQuery = true)
    Optional<BigDecimal> findPoAmountByPoNumber(@Param("poNumber") String poNumber, @Param("tenantId") Long tenantId);

    // 5. Get all active POs for tenant
    @Query(value = """
        SELECT * 
        FROM po_detail 
        WHERE tenant_id = :tenantId 
          AND end_timestamp IS NULL
    """, nativeQuery = true)
    List<PODetails> findAllActivePOs(@Param("tenantId") Long tenantId);

    // 6. Get PO vs Invoice data for dashboard
    @Query(value = """
        SELECT 
            p.project_name AS projectName,
            COALESCE(SUM(p.po_amount), 0) AS poAmount,
            (
                SELECT COALESCE(SUM(i.total_amount), 0)
                FROM invoices i
                WHERE i.supplier_name = p.supplier
                  AND i.customer_name = p.customer
            ) AS invoiceAmount
        FROM 
            po_detail p
        JOIN 
            tenant t ON p.tenant_id = t.tenant_id
        WHERE 
            p.tenant_id = :tenantId
            AND p.end_timestamp IS NULL
        GROUP BY 
            p.project_name, p.supplier, p.customer
        ORDER BY 
            MAX(p.po_startdate) DESC
    """, nativeQuery = true)
    List<PoVsInvoiceDTO> getPoVsInvoiceData(@Param("tenantId") Long tenantId);
}
