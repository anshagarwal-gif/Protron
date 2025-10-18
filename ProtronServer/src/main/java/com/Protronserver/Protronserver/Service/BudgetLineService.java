package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.Entities.*;
import com.Protronserver.Protronserver.Repository.*;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for Budget Line operations
 */
@Service
@Transactional
public class BudgetLineService {

    @Autowired
    private BudgetLineRepository budgetLineRepository;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    public BudgetLine save(BudgetLine budgetLine) {
        if (budgetLine.getBudgetId() == null) {
            // New budget line
            budgetLine.setStartTimestamp(LocalDateTime.now());
        } else {
            // Existing budget line
            budgetLine.setEndTimestamp(LocalDateTime.now());
        }
        return budgetLineRepository.save(budgetLine);
    }

    @Transactional(readOnly = true)
    public Optional<BudgetLine> findById(Integer budgetId) {
        return budgetLineRepository.findById(budgetId);
    }

    @Transactional(readOnly = true)
    public List<BudgetLine> findAll() {
        String tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId().toString();
        return budgetLineRepository.findByTenantIdAndEndTimestampIsNull(tenantId);
    }

    public void delete(Integer budgetId) {
        budgetLineRepository.deleteById(budgetId);
    }

    @Transactional(readOnly = true)
    public List<BudgetLine> findByTenantIdAndEndTimestampIsNull(String tenantId) {
        return budgetLineRepository.findByTenantIdAndEndTimestampIsNull(tenantId);
    }

    @Transactional(readOnly = true)
    public List<BudgetLine> findByBudgetOwner(String budgetOwner) {
        String tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId().toString();
        return budgetLineRepository.findByTenantIdAndBudgetOwnerAndEndTimestampIsNull(budgetOwner, tenantId);
    }

    @Transactional(readOnly = true)
    public List<BudgetLine> findBySponsor(String sponsor) {
        return budgetLineRepository.findBySponsor(sponsor);
    }

    @Transactional(readOnly = true)
    public List<BudgetLine> findByCurrency(String currency) {
        return budgetLineRepository.findByCurrency(currency);
    }

    @Transactional(readOnly = true)
    public List<BudgetLine> findByLob(String lob) {
        return budgetLineRepository.findByLob(lob);
    }

    @Transactional(readOnly = true)
    public List<BudgetLine> findByBudgetNameContaining(String budgetName) {
        return budgetLineRepository.findByBudgetNameContainingIgnoreCase(budgetName);
    }

    @Transactional(readOnly = true)
    public List<BudgetLine> findByTenantIdAndBudgetOwner(String tenantId, String budgetOwner) {
        return budgetLineRepository.findByTenantIdAndBudgetOwnerAndEndTimestampIsNull(tenantId, budgetOwner);
    }

    @Transactional(readOnly = true)
    public List<BudgetLine> findByAmountApprovedGreaterThan(BigDecimal amount) {
        return budgetLineRepository.findByAmountApprovedGreaterThan(amount);
    }

    @Transactional(readOnly = true)
    public List<BudgetLine> findByAmountAvailableGreaterThan(BigDecimal amount) {
        return budgetLineRepository.findByAmountAvailableGreaterThan(amount);
    }

    @Transactional(readOnly = true)
    public List<BudgetLine> findActiveBudgetLines() {
        return budgetLineRepository.findActiveBudgetLines();
    }

    @Transactional(readOnly = true)
    public List<BudgetLine> findExpiredBudgetLines() {
        return budgetLineRepository.findExpiredBudgetLines();
    }

    @Transactional(readOnly = true)
    public List<BudgetLine> findBudgetLinesWithAttachments() {
        return budgetLineRepository.findBudgetLinesWithAttachments();
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalApprovedAmountByTenant(String tenantId) {
        BigDecimal result = budgetLineRepository.getTotalApprovedAmountByTenant(tenantId);
        return result != null ? result : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalUtilizedAmountByTenant(String tenantId) {
        BigDecimal result = budgetLineRepository.getTotalUtilizedAmountByTenant(tenantId);
        return result != null ? result : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalAvailableAmountByTenant(String tenantId) {
        BigDecimal result = budgetLineRepository.getTotalAvailableAmountByTenant(tenantId);
        return result != null ? result : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public boolean existsByBudgetLineItem(String budgetLineItem) {
        return budgetLineRepository.existsByBudgetLineItem(budgetLineItem);
    }

    @Transactional(readOnly = true)
    public Optional<BudgetLine> findByBudgetLineItem(String budgetLineItem) {
        return budgetLineRepository.findByBudgetLineItem(budgetLineItem);
    }

    @Transactional(readOnly = true)
    public boolean validateAllocationAmounts(Integer budgetLineId, BigDecimal totalAllocationAmount) {
        Optional<BudgetLine> budgetLineOpt = budgetLineRepository.findById(budgetLineId);
        if (budgetLineOpt.isPresent()) {
            BudgetLine budgetLine = budgetLineOpt.get();
            return budgetLine.getAmountApproved().compareTo(totalAllocationAmount) >= 0;
        }
        return false;
    }

    public BudgetLine updateBudgetAmounts(Integer budgetId, BigDecimal amountUtilized, BigDecimal amountAvailable) {
        Optional<BudgetLine> budgetLineOpt = budgetLineRepository.findById(budgetId);
        if (budgetLineOpt.isPresent()) {
            BudgetLine budgetLine = budgetLineOpt.get();
            budgetLine.setAmountUtilized(amountUtilized);
            budgetLine.setAmountAvailable(amountAvailable);
            budgetLine.setEndTimestamp(LocalDateTime.now());
            return budgetLineRepository.save(budgetLine);
        }
        throw new RuntimeException("Budget line not found with ID: " + budgetId);
    }
}