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

/**
 * Repository interface for Budget Allocation entity with Native Queries
 */
@Repository
public interface BudgetAllocationRepository extends JpaRepository<BudgetAllocation, Integer> {

        List<BudgetAllocation> findByEndTimestampIsNull();
        /**
         * Find budget allocations by budget line ID
         */
        @Query(value = "SELECT * FROM budget_allocation WHERE budget_id = :budgetLineId", nativeQuery = true)
        List<BudgetAllocation> findByBudgetLineId(@Param("budgetLineId") Integer budgetLineId);

        @Query(value = "SELECT * FROM budget_allocation WHERE budget_id = :budgetLineId and end_timestamp is NULL", nativeQuery = true)
        List<BudgetAllocation> findByBudgetLineIdAndEndTimestampIsNull(@Param("budgetLineId") Integer budgetLineId);

        /**
         * Find budget allocations by tenant ID
         */
        @Query(value = "SELECT * FROM budget_allocation WHERE tenant_id = :tenantId and end_timestamp is NULL", nativeQuery = true)
        List<BudgetAllocation> findByTenantIdAndEndTimestampIsNull(@Param("tenantId") String tenantId);

        /**
         * Find budget allocations by vendor name
         */
        @Query(value = "SELECT * FROM budget_allocation WHERE vendor_name = :vendorName and end_timestamp is NULL", nativeQuery = true)
        List<BudgetAllocation> findByVendorName(@Param("vendorName") String vendorName);

        /**
         * Find budget allocations by system name
         */
        @Query(value = "SELECT * FROM budget_allocation WHERE system_name = :systemName and end_timestamp is NULL", nativeQuery = true)
        List<BudgetAllocation> findBySystemName(@Param("systemName") String systemName);

        /**
         * Find budget allocations by vendor name and system name
         */
        @Query(value = "SELECT * FROM budget_allocation WHERE vendor_name = :vendorName AND system_name = :systemName and end_timestamp is NULL", nativeQuery = true)
        List<BudgetAllocation> findByVendorNameAndSystemName(@Param("vendorName") String vendorName,
                        @Param("systemName") String systemName);

        /**
         * Find budget allocations by tenant ID and vendor name
         */
        @Query(value = "SELECT * FROM budget_allocation WHERE tenant_id = :tenantId AND vendor_name = :vendorName and end_timestamp is NULL", nativeQuery = true)
        List<BudgetAllocation> findByTenantIdAndVendorName(@Param("tenantId") String tenantId,
                        @Param("vendorName") String vendorName);

        /**
         * Find budget allocations where amount is greater than specified value
         */
        @Query(value = "SELECT * FROM budget_allocation WHERE amount > :amount and end_timestamp is NULL", nativeQuery = true)
        List<BudgetAllocation> findByAmountGreaterThan(@Param("amount") BigDecimal amount);

        /**
         * Find budget allocations where amount is between specified range
         */
        @Query(value = "SELECT * FROM budget_allocation WHERE amount BETWEEN :minAmount AND :maxAmount and end_timestamp is NULL", nativeQuery = true)
        List<BudgetAllocation> findByAmountBetween(@Param("minAmount") BigDecimal minAmount,
                        @Param("maxAmount") BigDecimal maxAmount);

        /**
         * Get total allocation amount for a specific budget line
         */
        @Query(value = "SELECT COALESCE(SUM(amount), 0) FROM budget_allocation WHERE budget_id = :budgetLineId and end_timestamp is NULL", nativeQuery = true)
        BigDecimal getTotalAllocationAmountByBudgetLineId(@Param("budgetLineId") Integer budgetLineId);

        /**
         * Get total allocation amount by tenant ID
         */
        @Query(value = "SELECT COALESCE(SUM(amount), 0) FROM budget_allocation WHERE tenant_id = :tenantId and end_timestamp is NULL", nativeQuery = true)
        BigDecimal getTotalAllocationAmountByTenant(@Param("tenantId") String tenantId);

        /**
         * Get total allocation amount by vendor name
         */
        @Query(value = "SELECT COALESCE(SUM(amount), 0) FROM budget_allocation WHERE vendor_name = :vendorName and end_timestamp is NULL", nativeQuery = true)
        BigDecimal getTotalAllocationAmountByVendor(@Param("vendorName") String vendorName);

        /**
         * Get total allocation amount by system name
         */
        @Query(value = "SELECT COALESCE(SUM(amount), 0) FROM budget_allocation WHERE system_name = :systemName and end_timestamp is NULL", nativeQuery = true)
        BigDecimal getTotalAllocationAmountBySystem(@Param("systemName") String systemName);

        /**
         * Count allocations by budget line ID
         */
        @Query(value = "SELECT COUNT(*) FROM budget_allocation WHERE budget_id = :budgetLineId and end_timestamp is NULL", nativeQuery = true)
        Long countAllocationsByBudgetLineId(@Param("budgetLineId") Integer budgetLineId);

        /**
         * Count allocations by vendor name
         */
        @Query(value = "SELECT COUNT(*) FROM budget_allocation WHERE vendor_name = :vendorName and end_timestamp is NULL", nativeQuery = true)
        Long countByVendorName(@Param("vendorName") String vendorName);

        /**
         * Count allocations by tenant ID
         */
        @Query(value = "SELECT COUNT(*) FROM budget_allocation WHERE tenant_id = :tenantId and end_timestamp is NULL", nativeQuery = true)
        Long countByTenantId(@Param("tenantId") String tenantId);

        /**
         * Find budget allocations with remarks containing specific text
         */
        @Query(value = "SELECT * FROM budget_allocation WHERE LOWER(remarks) LIKE LOWER(CONCAT('%', :remarks, '%')) and end_timestamp is NULL", nativeQuery = true)
        List<BudgetAllocation> findByRemarksContainingIgnoreCase(@Param("remarks") String remarks);

        /**
         * Delete all allocations for a specific budget line
         */
        @Modifying
        @Transactional
        @Query(value = "DELETE FROM budget_allocation WHERE budget_id = :budgetLineId", nativeQuery = true)
        void deleteByBudgetLineId(@Param("budgetLineId") Integer budgetLineId);

        /**
         * Check if allocation exists for a specific vendor and system combination
         */
        @Query(value = "SELECT COUNT(*) > 0 FROM budget_allocation WHERE vendor_name = :vendorName AND system_name = :systemName and end_timestamp is NULL", nativeQuery = true)
        boolean existsByVendorNameAndSystemName(@Param("vendorName") String vendorName,
                        @Param("systemName") String systemName);

        /**
         * Get allocation summary by vendor
         */
        @Query(value = "SELECT vendor_name, COUNT(*) as allocation_count, SUM(amount) as total_amount, AVG(amount) as avg_amount, MIN(amount) as min_amount, MAX(amount) as max_amount FROM budget_allocation WHERE tenant_id = :tenantId and end_timestamp is NULL GROUP BY vendor_name ORDER BY total_amount DESC", nativeQuery = true)
        List<Object[]> getAllocationSummaryByVendor(@Param("tenantId") String tenantId);

        /**
         * Get allocation summary by system
         */
        @Query(value = "SELECT system_name, COUNT(*) as allocation_count, SUM(amount) as total_amount, AVG(amount) as avg_amount FROM budget_allocation WHERE tenant_id = :tenantId and end_timestamp is NULL GROUP BY system_name ORDER BY total_amount DESC", nativeQuery = true)
        List<Object[]> getAllocationSummaryBySystem(@Param("tenantId") String tenantId);

        /**
         * Find top N vendors by allocation amount
         */
        @Query(value = "SELECT vendor_name, SUM(amount) as total_amount FROM budget_allocation WHERE tenant_id = :tenantId and end_timestamp is NULL GROUP BY vendor_name ORDER BY total_amount DESC", nativeQuery = true)
        List<Object[]> findTopVendorsByAmount(@Param("tenantId") String tenantId);

        /**
         * Get monthly allocation trend (simplified version)
         */
        @Query(value = "SELECT 'Current Month' as month, COUNT(allocation_id) as allocation_count, SUM(amount) as total_amount FROM budget_allocation WHERE tenant_id = :tenantId and end_timestamp is NULL", nativeQuery = true)
        List<Object[]> getMonthlyAllocationTrend(@Param("tenantId") String tenantId);
}