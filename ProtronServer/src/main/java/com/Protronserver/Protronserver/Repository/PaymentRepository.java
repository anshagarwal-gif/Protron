package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.Payment;
import com.Protronserver.Protronserver.Entities.PaymentStatus;
import com.Protronserver.Protronserver.Entities.PaymentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPaymentId(String paymentId);

    List<Payment> findByInvoiceId(Long invoiceId);

    List<Payment> findByInvoiceInvoiceId(String invoiceId);

    List<Payment> findByTenantId(Long tenantId);

    List<Payment> findByPaymentStatus(PaymentStatus paymentStatus);

    List<Payment> findByPaymentType(PaymentType paymentType);

    List<Payment> findByPaymentDateBetween(LocalDate startDate, LocalDate endDate);

    List<Payment> findByDueDateBefore(LocalDate date);

    List<Payment> findByIsReversedFalse();

    List<Payment> findByIsReversedTrue();

    @Query("SELECT p FROM Payment p WHERE p.invoice.id = :invoiceId AND p.isReversed = false ORDER BY p.createdAt DESC")
    List<Payment> findActivePaymentsByInvoiceId(@Param("invoiceId") Long invoiceId);

    @Query("SELECT p FROM Payment p WHERE p.invoice.invoiceId = :invoiceId AND p.isReversed = false ORDER BY p.createdAt DESC")
    List<Payment> findActivePaymentsByInvoiceInvoiceId(@Param("invoiceId") String invoiceId);

    @Query("SELECT SUM(p.paymentAmount) FROM Payment p WHERE p.invoice.id = :invoiceId AND p.isReversed = false AND p.paymentStatus IN :statuses")
    BigDecimal sumPaidAmountByInvoiceId(@Param("invoiceId") Long invoiceId, @Param("statuses") List<PaymentStatus> statuses);

    @Query("SELECT SUM(p.paymentAmount) FROM Payment p WHERE p.invoice.invoiceId = :invoiceId AND p.isReversed = false AND p.paymentStatus IN :statuses")
    BigDecimal sumPaidAmountByInvoiceInvoiceId(@Param("invoiceId") String invoiceId, @Param("statuses") List<PaymentStatus> statuses);

    @Query("SELECT SUM(p.remainingAmount) FROM Payment p WHERE p.invoice.id = :invoiceId AND p.isReversed = false AND p.paymentStatus IN :statuses")
    BigDecimal sumRemainingAmountByInvoiceId(@Param("invoiceId") Long invoiceId, @Param("statuses") List<PaymentStatus> statuses);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.invoice.id = :invoiceId AND p.isReversed = false AND p.paymentStatus IN :statuses")
    Long countPaymentsByInvoiceId(@Param("invoiceId") Long invoiceId, @Param("statuses") List<PaymentStatus> statuses);

    @Query("SELECT p FROM Payment p WHERE p.tenantId = :tenantId AND p.paymentStatus = :status AND p.dueDate < :date AND p.isReversed = false")
    List<Payment> findOverduePaymentsByTenantAndStatus(@Param("tenantId") Long tenantId, @Param("status") PaymentStatus status, @Param("date") LocalDate date);

    @Query("SELECT p FROM Payment p WHERE p.tenantId = :tenantId AND p.paymentDate BETWEEN :startDate AND :endDate AND p.isReversed = false")
    List<Payment> findPaymentsByTenantAndDateRange(@Param("tenantId") Long tenantId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT p FROM Payment p WHERE p.tenantId = :tenantId AND p.paymentMethod = :paymentMethod AND p.isReversed = false")
    List<Payment> findPaymentsByTenantAndPaymentMethod(@Param("tenantId") Long tenantId, @Param("paymentMethod") String paymentMethod);

    @Query("SELECT p FROM Payment p WHERE p.tenantId = :tenantId AND p.transactionReference = :transactionReference AND p.isReversed = false")
    List<Payment> findPaymentsByTenantAndTransactionReference(@Param("tenantId") Long tenantId, @Param("transactionReference") String transactionReference);

    @Query("SELECT p FROM Payment p WHERE p.tenantId = :tenantId AND p.settlementDate BETWEEN :startDate AND :endDate AND p.isReversed = false")
    List<Payment> findSettledPaymentsByTenantAndDateRange(@Param("tenantId") Long tenantId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT p.paymentMethod, COUNT(p), SUM(p.paymentAmount) FROM Payment p WHERE p.tenantId = :tenantId AND p.isReversed = false GROUP BY p.paymentMethod")
    List<Object[]> getPaymentSummaryByMethod(@Param("tenantId") Long tenantId);

    @Query("SELECT p FROM Payment p WHERE p.tenantId = :tenantId AND p.isReversed = false ORDER BY p.createdAt DESC")
    List<Payment> findAllActivePaymentsByTenant(@Param("tenantId") Long tenantId);

    boolean existsByPaymentId(String paymentId);

    boolean existsByTransactionReferenceAndTenantId(String transactionReference, Long tenantId);
}
