package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.Entities.*;
import com.Protronserver.Protronserver.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Service for Budget Allocation operations
 */
@Service
@Transactional
public class BudgetAllocationService {

    @Autowired
    private BudgetAllocationRepository budgetAllocationRepository;

    @Autowired
    private BudgetLineRepository budgetLineRepository;

    public BudgetAllocation save(BudgetAllocation budgetAllocation) {
        return budgetAllocationRepository.save(budgetAllocation);
    }

    @Transactional(readOnly = true)
    public Optional<BudgetAllocation> findById(Integer allocationId) {
        return budgetAllocationRepository.findById(allocationId);
    }

    @Transactional(readOnly = true)
    public List<BudgetAllocation> findAll() {
        return budgetAllocationRepository.findAll();
    }

    public void delete(Integer allocationId) {
        budgetAllocationRepository.deleteById(allocationId);
    }

    @Transactional(readOnly = true)
    public List<BudgetAllocation> findByBudgetLineId(Integer budgetLineId) {
        return budgetAllocationRepository.findByBudgetLineId(budgetLineId);
    }

    @Transactional(readOnly = true)
    public List<BudgetAllocation> findByTenantId(String tenantId) {
        return budgetAllocationRepository.findByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public List<BudgetAllocation> findByVendorName(String vendorName) {
        return budgetAllocationRepository.findByVendorName(vendorName);
    }

    @Transactional(readOnly = true)
    public List<BudgetAllocation> findBySystemName(String systemName) {
        return budgetAllocationRepository.findBySystemName(systemName);
    }

    @Transactional(readOnly = true)
    public List<BudgetAllocation> findByVendorNameAndSystemName(String vendorName, String systemName) {
        return budgetAllocationRepository.findByVendorNameAndSystemName(vendorName, systemName);
    }

    @Transactional(readOnly = true)
    public List<BudgetAllocation> findByTenantIdAndVendorName(String tenantId, String vendorName) {
        return budgetAllocationRepository.findByTenantIdAndVendorName(tenantId, vendorName);
    }

    @Transactional(readOnly = true)
    public List<BudgetAllocation> findByAmountGreaterThan(BigDecimal amount) {
        return budgetAllocationRepository.findByAmountGreaterThan(amount);
    }

    @Transactional(readOnly = true)
    public List<BudgetAllocation> findByAmountBetween(BigDecimal minAmount, BigDecimal maxAmount) {
        return budgetAllocationRepository.findByAmountBetween(minAmount, maxAmount);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalAllocationAmountByBudgetLineId(Integer budgetLineId) {
        BigDecimal result = budgetAllocationRepository.getTotalAllocationAmountByBudgetLineId(budgetLineId);
        return result != null ? result : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalAllocationAmountByTenant(String tenantId) {
        BigDecimal result = budgetAllocationRepository.getTotalAllocationAmountByTenant(tenantId);
        return result != null ? result : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalAllocationAmountByVendor(String vendorName) {
        BigDecimal result = budgetAllocationRepository.getTotalAllocationAmountByVendor(vendorName);
        return result != null ? result : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalAllocationAmountBySystem(String systemName) {
        BigDecimal result = budgetAllocationRepository.getTotalAllocationAmountBySystem(systemName);
        return result != null ? result : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public Long countAllocationsByBudgetLineId(Integer budgetLineId) {
        return budgetAllocationRepository.countAllocationsByBudgetLineId(budgetLineId);
    }

    @Transactional(readOnly = true)
    public Long countByVendorName(String vendorName) {
        return budgetAllocationRepository.countByVendorName(vendorName);
    }

    @Transactional(readOnly = true)
    public Long countByTenantId(String tenantId) {
        return budgetAllocationRepository.countByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public List<BudgetAllocation> findByRemarksContaining(String remarks) {
        return budgetAllocationRepository.findByRemarksContainingIgnoreCase(remarks);
    }

    public void deleteByBudgetLineId(Integer budgetLineId) {
        budgetAllocationRepository.deleteByBudgetLineId(budgetLineId);
    }

    @Transactional(readOnly = true)
    public boolean existsByVendorNameAndSystemName(String vendorName, String systemName) {
        return budgetAllocationRepository.existsByVendorNameAndSystemName(vendorName, systemName);
    }

    public List<BudgetAllocation> saveAll(List<BudgetAllocation> budgetAllocations) {
        return budgetAllocationRepository.saveAll(budgetAllocations);
    }

    @Transactional(readOnly = true)
    public boolean validateAllocationAmount(Integer budgetLineId, BigDecimal allocationAmount) {
        Optional<BudgetLine> budgetLineOpt = budgetLineRepository.findById(budgetLineId);
        if (budgetLineOpt.isPresent()) {
            BudgetLine budgetLine = budgetLineOpt.get();

            // Get current total allocations for this budget line
            BigDecimal currentTotalAllocations = getTotalAllocationAmountByBudgetLineId(budgetLineId);

            // Add the new allocation amount
            BigDecimal newTotalAllocations = currentTotalAllocations.add(allocationAmount);

            // Check if new total is within approved amount
            return budgetLine.getAmountApproved().compareTo(newTotalAllocations) >= 0;
        }
        return false;
    }
}
