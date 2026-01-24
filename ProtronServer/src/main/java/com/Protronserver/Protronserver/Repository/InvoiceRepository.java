package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.DashboardRecords.InvoiceTrendDTO;
import com.Protronserver.Protronserver.Entities.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceId(String invoiceId);
    boolean existsByInvoiceId(String invoiceId);

    @Query(value = """
        SELECT COUNT(*) FROM invoices 
        WHERE created_at >= :startDateTime 
          AND created_at < :endDateTime
    """, nativeQuery = true)
    long countInvoicesCreatedToday(
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
    );

    List<Invoice> findByTenantIdAndDeletedFalseOrderByCreatedAtDesc(Long tenantId);

    List<Invoice> findAllByOrderByCreatedAtDesc();

    List<Invoice> findByDeletedTrueOrderByDeletedAtDesc();

    @Query(value = """
        SELECT * FROM invoices 
        WHERE LOWER(customer_name) LIKE LOWER(CONCAT('%', :customerName, '%')) 
          AND deleted = false AND tenant_id = :tenantId
        ORDER BY created_at DESC
    """, nativeQuery = true)
    List<Invoice> findByTenantIdAndCustomerNameContainingIgnoreCase(@Param("customerName") String customerName, @Param("tenantId") Long tenantId);

    @Query(value = """
    SELECT 
        DATE_FORMAT(MAX(from_date), '%M %Y') AS month,
        SUM(total_amount) AS totalAmount
    FROM invoices
    WHERE from_date IS NOT NULL
    GROUP BY YEAR(from_date), MONTH(from_date)
    ORDER BY MAX(from_date) DESC
    """, nativeQuery = true)
    List<Object[]> getMonthlyInvoiceTrendsRaw();
}
