package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Budget Line entity with Native Queries
 */
@Repository
public interface BudgetLineRepository extends JpaRepository<BudgetLine, Integer> {

    /**
     * Find budget lines by tenant ID
     */
    @Query(value = "SELECT * FROM budget_line WHERE tenant_id = :tenantId", nativeQuery = true)
    List<BudgetLine> findByTenantId(@Param("tenantId") String tenantId);

    /**
     * Find budget lines by budget owner
     */
    @Query(value = "SELECT * FROM budget_line WHERE budget_owner = :budgetOwner", nativeQuery = true)
    List<BudgetLine> findByBudgetOwner(@Param("budgetOwner") String budgetOwner);

    /**
     * Find budget lines by sponsor
     */
    @Query(value = "SELECT * FROM budget_line WHERE sponsor = :sponsor", nativeQuery = true)
    List<BudgetLine> findBySponsor(@Param("sponsor") String sponsor);

    /**
     * Find budget lines by currency
     */
    @Query(value = "SELECT * FROM budget_line WHERE currency = :currency", nativeQuery = true)
    List<BudgetLine> findByCurrency(@Param("currency") String currency);

    /**
     * Find budget lines by LOB (Line of Business)
     */
    @Query(value = "SELECT * FROM budget_line WHERE lob = :lob", nativeQuery = true)
    List<BudgetLine> findByLob(@Param("lob") String lob);

    /**
     * Find budget lines by budget name containing specific text (case insensitive)
     */
    @Query(value = "SELECT * FROM budget_line WHERE LOWER(budget_name) LIKE LOWER(CONCAT('%', :budgetName, '%'))", nativeQuery = true)
    List<BudgetLine> findByBudgetNameContainingIgnoreCase(@Param("budgetName") String budgetName);

    /**
     * Find budget lines by tenant ID and budget owner
     */
    @Query(value = "SELECT * FROM budget_line WHERE tenant_id = :tenantId AND budget_owner = :budgetOwner", nativeQuery = true)
    List<BudgetLine> findByTenantIdAndBudgetOwner(@Param("tenantId") String tenantId,
            @Param("budgetOwner") String budgetOwner);

    /**
     * Find budget lines where amount approved is greater than specified amount
     */
    @Query(value = "SELECT * FROM budget_line WHERE amount_approved > :amount", nativeQuery = true)
    List<BudgetLine> findByAmountApprovedGreaterThan(@Param("amount") BigDecimal amount);

    /**
     * Find budget lines where amount available is greater than specified amount
     */
    @Query(value = "SELECT * FROM budget_line WHERE amount_available > :amount", nativeQuery = true)
    List<BudgetLine> findByAmountAvailableGreaterThan(@Param("amount") BigDecimal amount);

    /**
     * Find budget lines by tenant ID and currency
     */
    @Query(value = "SELECT * FROM budget_line WHERE tenant_id = :tenantId AND currency = :currency", nativeQuery = true)
    List<BudgetLine> findByTenantIdAndCurrency(@Param("tenantId") String tenantId, @Param("currency") String currency);

    /**
     * Find budget lines where budget end date is after current date
     */
    @Query(value = "SELECT * FROM budget_line WHERE budget_end_date > CURRENT_DATE", nativeQuery = true)
    List<BudgetLine> findActiveBudgetLines();

    /**
     * Find budget lines where budget end date is before current date
     */
    @Query(value = "SELECT * FROM budget_line WHERE budget_end_date < CURRENT_DATE", nativeQuery = true)
    List<BudgetLine> findExpiredBudgetLines();

    /**
     * Find budget lines with attachments
     */
    @Query(value = "SELECT * FROM budget_line WHERE attachment IS NOT NULL AND LENGTH(attachment) > 0", nativeQuery = true)
    List<BudgetLine> findBudgetLinesWithAttachments();

    /**
     * Get total approved amount by tenant ID
     */
    @Query(value = "SELECT COALESCE(SUM(amount_approved), 0) FROM budget_line WHERE tenant_id = :tenantId", nativeQuery = true)
    BigDecimal getTotalApprovedAmountByTenant(@Param("tenantId") String tenantId);

    /**
     * Get total utilized amount by tenant ID
     */
    @Query(value = "SELECT COALESCE(SUM(amount_utilized), 0) FROM budget_line WHERE tenant_id = :tenantId", nativeQuery = true)
    BigDecimal getTotalUtilizedAmountByTenant(@Param("tenantId") String tenantId);

    /**
     * Get total available amount by tenant ID
     */
    @Query(value = "SELECT COALESCE(SUM(amount_available), 0) FROM budget_line WHERE tenant_id = :tenantId", nativeQuery = true)
    BigDecimal getTotalAvailableAmountByTenant(@Param("tenantId") String tenantId);

    /**
     * Check if budget line exists by budget line item
     */
    @Query(value = "SELECT COUNT(*) > 0 FROM budget_line WHERE budget_line_item = :budgetLineItem", nativeQuery = true)
    boolean existsByBudgetLineItem(@Param("budgetLineItem") String budgetLineItem);

    /**
     * Find budget line by budget line item
     */
    @Query(value = "SELECT * FROM budget_line WHERE budget_line_item = :budgetLineItem LIMIT 1", nativeQuery = true)
    Optional<BudgetLine> findByBudgetLineItem(@Param("budgetLineItem") String budgetLineItem);

    /**
     * Update budget amounts using native query
     */
    @Modifying
    @Transactional
    @Query(value = "UPDATE budget_line SET amount_utilized = :amountUtilized, amount_available = :amountAvailable, end_timestamp = CURRENT_TIMESTAMP WHERE budget_id = :budgetId", nativeQuery = true)
    int updateBudgetAmounts(@Param("budgetId") Integer budgetId,
            @Param("amountUtilized") BigDecimal amountUtilized,
            @Param("amountAvailable") BigDecimal amountAvailable);

    /**
     * Get budget lines with allocation summary
     */
    @Query(value = "SELECT bl.*, COALESCE(alloc_summary.total_allocations, 0) as total_allocations, COALESCE(alloc_summary.allocation_count, 0) as allocation_count FROM budget_line bl LEFT JOIN (SELECT budget_id, SUM(amount) as total_allocations, COUNT(*) as allocation_count FROM budget_allocation GROUP BY budget_id) alloc_summary ON bl.budget_id = alloc_summary.budget_id WHERE bl.tenant_id = :tenantId", nativeQuery = true)
    List<Object[]> findBudgetLinesWithAllocationSummary(@Param("tenantId") String tenantId);

    /**
     * Find budget lines approaching budget limit (>90% allocated)
     */
    @Query(value = "SELECT bl.* FROM budget_line bl LEFT JOIN (SELECT budget_id, SUM(amount) as total_allocated FROM budget_allocation GROUP BY budget_id) alloc ON bl.budget_id = alloc.budget_id WHERE bl.tenant_id = :tenantId AND COALESCE(alloc.total_allocated, 0) > (bl.amount_approved * 0.9)", nativeQuery = true)
    List<BudgetLine> findBudgetLinesNearingLimit(@Param("tenantId") String tenantId);
}