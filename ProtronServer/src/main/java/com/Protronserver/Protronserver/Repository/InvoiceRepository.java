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

    List<Invoice> findByCustomerNameContainingIgnoreCase(String customerName);

    List<Invoice> findByEmployeeNameContainingIgnoreCase(String employeeName);

    @Query(value = """
        SELECT * FROM invoices 
        WHERE from_date >= :startDate 
          AND to_date <= :endDate
    """, nativeQuery = true)
    List<Invoice> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query(value = """
        SELECT * FROM invoices 
        WHERE created_at >= :startDate 
        ORDER BY created_at DESC
    """, nativeQuery = true)
    List<Invoice> findRecentInvoices(@Param("startDate") LocalDate startDate);

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

    @Query(value = """
        SELECT COUNT(*) FROM invoices 
        WHERE DATE(created_at) = :date
    """, nativeQuery = true)
    long countInvoicesCreatedOnDate(@Param("date") LocalDate date);

    @Query(value = """
        SELECT * FROM invoices 
        WHERE DATE(created_at) = CURRENT_DATE 
        ORDER BY created_at DESC
    """, nativeQuery = true)
    List<Invoice> findInvoicesCreatedToday();

    @Query(value = """
        SELECT invoice_id FROM invoices 
        WHERE DATE(created_at) = CURRENT_DATE 
          AND invoice_id LIKE 'INV-%' 
        ORDER BY created_at DESC
    """, nativeQuery = true)
    List<String> findTodaysInvoiceIds();

    @Query(value = """
        SELECT COUNT(*) FROM invoices 
        WHERE DATE(created_at) = CURRENT_DATE
    """, nativeQuery = true)
    long countTodaysInvoices();

    List<Invoice> findByTenantIdAndDeletedFalseOrderByCreatedAtDesc(Long tenantId);

    List<Invoice> findAllByOrderByCreatedAtDesc();

    List<Invoice> findByDeletedTrueOrderByDeletedAtDesc();

    Optional<Invoice> findByInvoiceIdAndDeletedFalse(String invoiceId);

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
