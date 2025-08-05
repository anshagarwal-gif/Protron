package com.Protronserver.Protronserver.Repository;

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

    @Query("SELECT i FROM Invoice i WHERE i.fromDate >= :startDate AND i.toDate <= :endDate")
    List<Invoice> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT i FROM Invoice i WHERE i.createdAt >= :startDate ORDER BY i.createdAt DESC")
    List<Invoice> findRecentInvoices(@Param("startDate") LocalDate startDate);

    boolean existsByInvoiceId(String invoiceId);

    /**
     * Count invoices created today for generating sequential invoice IDs
     * Using LocalDateTime for proper type matching
     * 
     * @param startDateTime Start of the day (00:00:00)
     * @param endDateTime   End of the day (23:59:59)
     * @return Count of invoices created today
     */
    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.createdAt >= :startDateTime AND i.createdAt < :endDateTime")
    long countInvoicesCreatedToday(@Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime);

    /**
     * Alternative method using LocalDateTime for more precise control
     */
    @Query("SELECT COUNT(i) FROM Invoice i WHERE DATE(i.createdAt) = :date")
    long countInvoicesCreatedOnDate(@Param("date") LocalDate date);

    /**
     * Find invoices created today (for verification)
     */
    @Query("SELECT i FROM Invoice i WHERE DATE(i.createdAt) = CURRENT_DATE ORDER BY i.createdAt DESC")
    List<Invoice> findInvoicesCreatedToday();

    /**
     * Get the last invoice ID created today (for backup sequence generation)
     */
    @Query("SELECT i.invoiceId FROM Invoice i WHERE DATE(i.createdAt) = CURRENT_DATE AND i.invoiceId LIKE 'INV-%' ORDER BY i.createdAt DESC")
    List<String> findTodaysInvoiceIds();

    /**
     * Alternative count method using date functions (more database-agnostic)
     */
    @Query("SELECT COUNT(i) FROM Invoice i WHERE FUNCTION('DATE', i.createdAt) = FUNCTION('DATE', CURRENT_DATE)")
    long countTodaysInvoices();

    // Find all non-deleted invoices
    List<Invoice> findByDeletedFalseOrderByCreatedAtDesc();

    // Find all invoices including deleted ones
    List<Invoice> findAllByOrderByCreatedAtDesc();

    // Find only deleted invoices
    List<Invoice> findByDeletedTrueOrderByDeletedAtDesc();

    // Find non-deleted invoice by invoiceId
    Optional<Invoice> findByInvoiceIdAndDeletedFalse(String invoiceId);

    // Find invoice by invoiceId regardless of deleted status

    // Search non-deleted invoices by customer name
    @Query("SELECT i FROM Invoice i WHERE LOWER(i.customerName) LIKE LOWER(CONCAT('%', :customerName, '%')) AND i.deleted = false ORDER BY i.createdAt DESC")
    List<Invoice> findByCustomerNameContainingIgnoreCaseAndDeletedFalse(@Param("customerName") String customerName);

}