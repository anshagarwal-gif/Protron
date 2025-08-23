package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.BudgetDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BudgetDocumentRepository extends JpaRepository<BudgetDocument, Integer> {

    /**
     * Find all documents by budget line ID
     */
    List<BudgetDocument> findByBudgetLine_BudgetId(Integer budgetId);

    /**
     * Find all documents by tenant ID
     */
    List<BudgetDocument> findByTenantId(String tenantId);

    /**
     * Find documents by budget line ID and tenant ID
     */
    List<BudgetDocument> findByBudgetLine_BudgetIdAndTenantId(Integer budgetId, String tenantId);

    /**
     * Count documents by budget line ID
     */
    long countByBudgetLine_BudgetId(Integer budgetId);

    /**
     * Delete all documents by budget line ID
     */
    void deleteByBudgetLine_BudgetId(Integer budgetId);

    /**
     * Find documents by file name and tenant ID
     */
    List<BudgetDocument> findByFileNameAndTenantId(String fileName, String tenantId);
}
