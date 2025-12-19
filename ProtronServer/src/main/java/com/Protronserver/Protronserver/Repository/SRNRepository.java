package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.SRNDetails;
import com.Protronserver.Protronserver.Utils.SRNLinkedPayments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface SRNRepository extends JpaRepository<SRNDetails, Long> {

    @Query("""
    SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END
    FROM SRNDetails s
    WHERE s.poDetail.poId = :poId
      AND LOWER(s.srnName) = LOWER(:srnName)
      AND s.tenantId = :tenantId
      AND s.lastUpdateTimestamp IS NULL
""")
    boolean existsActiveSrnByPoIdAndName(
            @Param("poId") Long poId,
            @Param("srnName") String srnName,
            @Param("tenantId") Long tenantId
    );

    @Query("""
    SELECT 
        s.poDetail.poAmount AS poAmount,
        s.milestone.msAmount AS milestoneAmount
    FROM SRNDetails s
    WHERE s.srnId = :srnId
      AND s.tenantId = :tenantId
      AND s.lastUpdateTimestamp IS NULL
""")
    SRNLinkedPayments findLinkedPoAndMilestoneAmountBySrnId(
            @Param("srnId") Long srnId,
            @Param("tenantId") Long tenantId
    );

    @Query("SELECT s FROM SRNDetails s WHERE s.poDetail.poId = :poId AND s.milestone.msId = :msId AND s.tenantId = :tenantId AND s.lastUpdateTimestamp IS NULL")
    List<SRNDetails> findByPoIdAndMsId(@Param("poId") Long poId, @Param("msId") Long msId, @Param("tenantId") Long tenantId);

    @Query("SELECT s FROM SRNDetails s WHERE s.poDetail.poId = :poId AND s.tenantId = :tenantId AND s.lastUpdateTimestamp IS NULL")
    List<SRNDetails> findByPoIdWithoutMs(@Param("poId") Long poId, @Param("tenantId") Long tenantId);

    @Query("SELECT s FROM SRNDetails s WHERE s.tenantId = :tenantId AND s.lastUpdateTimestamp IS NULL")
    List<SRNDetails> findAllActive(@Param("tenantId") Long tenantId);

    @Query("SELECT s FROM SRNDetails s WHERE s.poDetail.poId = :poId AND s.tenantId = :tenantId AND s.lastUpdateTimestamp IS NULL")
    List<SRNDetails> findByPoDetail_PoId(@Param("poId") Long poId, @Param("tenantId") Long tenantId);

    @Query("SELECT s FROM SRNDetails s WHERE s.poNumber = :poNumber AND s.tenantId = :tenantId AND s.lastUpdateTimestamp IS NULL")
    List<SRNDetails> findByPoNumber(@Param("poNumber") String poNumber, @Param("tenantId") Long tenantId);

    @Query("SELECT s FROM SRNDetails s WHERE s.milestone.msName = :msName AND s.tenantId = :tenantId AND s.lastUpdateTimestamp IS NULL")
    List<SRNDetails> findByMilestone_MsName(@Param("msName") String msName, @Param("tenantId") Long tenantId);

    @Query("SELECT s FROM SRNDetails s WHERE s.srnName = :srnName AND s.tenantId = :tenantId AND s.lastUpdateTimestamp IS NULL")
    List<SRNDetails> findBySrnName(@Param("srnName") String srnName, @Param("tenantId") Long tenantId);

    @Query(value = "SELECT COALESCE(SUM(s.srn_amount), 0) FROM srn_details s WHERE s.po_id = :poId AND s.ms_id = :msId AND s.tenant_id = :tenantId AND s.lastupdate_timestamp IS NULL", nativeQuery = true)
    BigDecimal sumSrnAmountsByPoIdAndMsId(@Param("poId") Long poId, @Param("msId") Long msId, @Param("tenantId") Long tenantId);

    @Query(value = "SELECT COALESCE(SUM(s.srn_amount), 0) FROM srn_details s WHERE s.po_id = :poId AND s.tenant_id = :tenantId AND s.lastupdate_timestamp IS NULL", nativeQuery = true)
    BigDecimal sumSrnAmountsByPoId(@Param("poId") Long poId, @Param("tenantId") Long tenantId);

    @Query(value = """
    SELECT COALESCE(SUM(srn_amount), 0)
    FROM srn_details
    WHERE po_id = :poId
      AND tenant_id = :tenantId
      AND ms_id IS NULL
      AND lastupdate_timestamp IS NULL
""", nativeQuery = true)
    BigDecimal sumSrnAmountsWithoutMilestoneByPoId(@Param("poId") Long poId, @Param("tenantId") Long tenantId);

}
