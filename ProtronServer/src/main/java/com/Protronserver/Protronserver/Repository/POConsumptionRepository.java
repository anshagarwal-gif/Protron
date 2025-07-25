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

    List<POConsumption> findByPoNumber(String poNumber);

    List<POConsumption> findByPoNumberAndMilestone_MsName(String poNumber, String msName);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM POConsumption p WHERE p.poNumber = :poNumber")
    BigDecimal sumConsumptionAmountsByPoNumber(@Param("poNumber") String poNumber);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM POConsumption p WHERE p.poNumber = :poNumber AND p.utilizationId != :utilizationId")
    BigDecimal sumConsumptionAmountsByPoNumberExcludingId(@Param("poNumber") String poNumber,
                                                          @Param("utilizationId") Long utilizationId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM POConsumption p WHERE p.poNumber = :poNumber AND p.milestone.msId = :msId AND p.utilizationId != :utilizationId")
    BigDecimal sumConsumptionAmountsByPoNumberAndMsNameExcludingId(@Param("poNumber") String poNumber,
                                                                   @Param("msId") Long msId,
                                                                   @Param("utilizationId") Long utilizationId);

    @Query(value = "SELECT COALESCE(SUM(p.amount), 0) FROM po_utilization p WHERE p.po_number = :poNumber AND p.ms_id = :msId", nativeQuery = true)
    BigDecimal sumConsumptionAmountsByPoNumberAndMsId(@Param("poNumber") String poNumber,
                                                      @Param("msId") Long msId);

    @Query(value = "SELECT COALESCE(SUM(p.amount), 0) FROM po_utilization p WHERE p.po_number = :poNumber AND p.ms_id = :msId AND utilization_id <> :excludeId", nativeQuery = true)
    BigDecimal sumConsumptionAmountsByPoNumberAndMsIdExcludingId(@Param("poNumber") String poNumber,
                                                                 @Param("msId") Long msId,
                                                                 @Param("excludeId") Long excludeId);

}