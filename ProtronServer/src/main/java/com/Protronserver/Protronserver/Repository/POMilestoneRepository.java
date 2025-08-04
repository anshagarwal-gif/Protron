package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.POMilestone;
import com.Protronserver.Protronserver.Utils.MilestoneInfo;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface POMilestoneRepository extends JpaRepository<POMilestone, Long> {

    @Query("SELECT m FROM POMilestone m WHERE m.tenantId = :tenantId AND m.endTimestamp IS NULL")
    List<POMilestone> findAllActiveMilestones(@Param("tenantId") Long tenantId);

    @Query("SELECT m FROM POMilestone m WHERE m.poDetail.poId = :poId AND m.tenantId = :tenantId AND m.endTimestamp IS NULL")
    List<POMilestone> findByPoDetail_PoId(@Param("poId") Long poId, @Param("tenantId") Long tenantId);

    // 🔹 Name & amount of active milestones
    @Query(value = "SELECT ms_id as msId, ms_name as msName, ms_amount as msAmount FROM po_milestone WHERE po_id = :poId AND tenant_id = :tenantId AND end_timestamp IS NULL", nativeQuery = true)
    List<MilestoneInfo> findMilestoneInfoByPoId(@Param("poId") Long poId, @Param("tenantId") Long tenantId);

    // 🔹 Count only active milestones
    @Query(value = "SELECT COUNT(*) FROM po_milestone WHERE po_id = :poId AND tenant_id = :tenantId AND end_timestamp IS NULL", nativeQuery = true)
    long countByPoId(@Param("poId") Long poId, @Param("tenantId") Long tenantId);

    // 🔹 Find amount of an active milestone
    @Query(value = "SELECT ms_amount FROM po_milestone WHERE po_id = :poId AND ms_id = :msId AND tenant_id = :tenantId AND end_timestamp IS NULL", nativeQuery = true)
    Optional<Integer> findAmountByPoIdAndMsId(@Param("poId") Long poId, @Param("msId") Long msId, @Param("tenantId") Long tenantId);

    // 🔹 Sum of all active milestone amounts for a PO
    @Query(value = "SELECT COALESCE(SUM(ms_amount), 0) FROM po_milestone WHERE po_id = :poId AND tenant_id = :tenantId AND end_timestamp IS NULL", nativeQuery = true)
    BigDecimal sumMilestoneAmountsByPoId(@Param("poId") Long poId, @Param("tenantId") Long tenantId);

    // 🔹 Check if active milestone exists by PO number and msId
    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM POMilestone m WHERE m.poDetail.poNumber = :poNumber AND m.msId = :msId AND m.tenantId = :tenantId AND m.endTimestamp IS NULL")
    boolean existsByPoDetail_PoNumberAndMsId(@Param("poNumber") String poNumber, @Param("msId") Long msId, @Param("tenantId") Long tenantId);

    // 🔹 Count active milestones by PO number
    @Query("SELECT COUNT(m) FROM POMilestone m WHERE m.poDetail.poNumber = :poNumber AND m.tenantId = :tenantId AND m.endTimestamp IS NULL")
    long countByPoDetail_PoNumber(@Param("poNumber") String poNumber, @Param("tenantId") Long tenantId);

    // 🔹 Get active milestone by PO number and msId
    @Query(value = "SELECT * FROM po_milestone WHERE po_number = :poNumber AND ms_id = :msId AND tenant_id = :tenantId AND end_timestamp IS NULL", nativeQuery = true)
    Optional<POMilestone> findByPoNumberAndMsId(@Param("poNumber") String poNumber, @Param("msId") Long msId, @Param("tenantId") Long tenantId);
}
