package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.POConsumption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface POConsumptionRepository extends JpaRepository<POConsumption, Long> {

    /**
     * Find all PO consumptions by PO number
     */
    List<POConsumption> findByPoNumber(String poNumber);

    /**
     * Find all PO consumptions by PO number and milestone name
     */
    List<POConsumption> findByPoNumberAndMsName(String poNumber, String msName);

    /**
     * Sum all consumption amounts for a specific PO
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM POConsumption p WHERE p.poNumber = :poNumber")
    BigDecimal sumConsumptionAmountsByPoNumber(@Param("poNumber") String poNumber);

    /**
     * Sum all consumption amounts for a specific PO and milestone
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM POConsumption p WHERE p.poNumber = :poNumber AND p.msName = :msName")
    BigDecimal sumConsumptionAmountsByPoNumberAndMsName(@Param("poNumber") String poNumber,
            @Param("msName") String msName);

    /**
     * Sum all consumption amounts for a specific PO excluding a particular
     * consumption record
     * (Useful for update operations)
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM POConsumption p WHERE p.poNumber = :poNumber AND p.utilizationId != :utilizationId")
    BigDecimal sumConsumptionAmountsByPoNumberExcludingId(@Param("poNumber") String poNumber,
            @Param("utilizationId") Long utilizationId);

    /**
     * Sum all consumption amounts for a specific PO and milestone excluding a
     * particular consumption record
     * (Useful for update operations)
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM POConsumption p WHERE p.poNumber = :poNumber AND p.msName = :msName AND p.utilizationId != :utilizationId")
    BigDecimal sumConsumptionAmountsByPoNumberAndMsNameExcludingId(@Param("poNumber") String poNumber,
            @Param("msName") String msName, @Param("utilizationId") Long utilizationId);
}