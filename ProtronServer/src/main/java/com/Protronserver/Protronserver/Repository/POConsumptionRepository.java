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

    @Query("SELECT p FROM POConsumption p WHERE p.poNumber = :poNumber AND p.tenantId = :tenantId AND p.lastUpdateTimestamp IS NULL")
    List<POConsumption> findByPoNumber(@Param("poNumber") String poNumber, @Param("tenantId") Long tenantId);

    @Query("SELECT p FROM POConsumption p WHERE p.poId = :poNumber AND p.tenantId = :tenantId AND p.lastUpdateTimestamp IS NULL")
    List<POConsumption> findByPoId(@Param("poNumber") String poNumber, @Param("tenantId") Long tenantId);

    // 🔹 Get all active POConsumptions by PO Number and Milestone Name
    @Query("SELECT p FROM POConsumption p WHERE p.poNumber = :poNumber AND p.milestone.msName = :msName AND p.tenantId = :tenantId AND p.lastUpdateTimestamp IS NULL")
    List<POConsumption> findByPoNumberAndMilestone_MsName(@Param("poNumber") String poNumber,
                                                          @Param("msName") String msName,
                                                          @Param("tenantId") Long tenantId);

    // 🔹 Sum of active consumption amounts by PO Number
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM POConsumption p WHERE p.poNumber = :poNumber AND p.tenantId = :tenantId AND p.lastUpdateTimestamp IS NULL")
    BigDecimal sumConsumptionAmountsByPoNumber(@Param("poNumber") String poNumber,
                                               @Param("tenantId") Long tenantId);

    // 🔹 Sum excluding current by PO Number
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM POConsumption p WHERE p.poNumber = :poNumber AND p.utilizationId != :utilizationId AND p.tenantId = :tenantId AND p.lastUpdateTimestamp IS NULL")
    BigDecimal sumConsumptionAmountsByPoNumberExcludingId(@Param("poNumber") String poNumber,
                                                          @Param("utilizationId") Long utilizationId,
                                                          @Param("tenantId") Long tenantId);

    // 🔹 Sum by PO Number and Milestone ID excluding current (JPQL)
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM POConsumption p WHERE p.poNumber = :poNumber AND p.milestone.msId = :msId AND p.utilizationId != :utilizationId AND p.tenantId = :tenantId AND p.lastUpdateTimestamp IS NULL")
    BigDecimal sumConsumptionAmountsByPoNumberAndMsNameExcludingId(@Param("poNumber") String poNumber,
                                                                   @Param("msId") Long msId,
                                                                   @Param("utilizationId") Long utilizationId,
                                                                   @Param("tenantId") Long tenantId);

    // 🔹 Sum by PO Number and Milestone ID (native)
    @Query(value = "SELECT COALESCE(SUM(p.amount), 0) " +
            "FROM po_utilization p " +
            "WHERE p.po_number = :poNumber " +
            "  AND p.ms_id = :msId " +
            "  AND p.tenant_id = :tenantId " +
            "  AND p.lastupdate_timestamp IS NULL", nativeQuery = true)
    BigDecimal sumConsumptionAmountsByPoNumberAndMsId(@Param("poNumber") String poNumber,
                                                      @Param("msId") Long msId,
                                                      @Param("tenantId") Long tenantId);

    // 🔹 Sum by PO Number and Milestone ID excluding one record (native)
    @Query(value = "SELECT COALESCE(SUM(p.amount), 0) FROM po_utilization p WHERE p.po_number = :poNumber AND p.ms_id = :msId AND p.utilization_id <> :excludeId AND p.tenant_id = :tenantId AND p.lastupdate_timestamp IS NULL", nativeQuery = true)
    BigDecimal sumConsumptionAmountsByPoNumberAndMsIdExcludingId(@Param("poNumber") String poNumber,
                                                                 @Param("msId") Long msId,
                                                                 @Param("excludeId") Long excludeId,
                                                                 @Param("tenantId") Long tenantId);

    @Query("SELECT p FROM POConsumption p WHERE p.tenantId = :tenantId AND p.lastUpdateTimestamp IS NULL")
    List<POConsumption> findAllActive(@Param("tenantId") Long tenantId);
}
