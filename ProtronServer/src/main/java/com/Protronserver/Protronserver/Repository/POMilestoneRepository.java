package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.POMilestone;
import com.Protronserver.Protronserver.Utils.MilestoneInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface POMilestoneRepository extends JpaRepository<POMilestone, Long> {

    @Query("SELECT m FROM POMilestone m WHERE m.endTimestamp IS NULL")
    List<POMilestone> findAllActiveMilestones();

    @Query("SELECT m FROM POMilestone m WHERE m.poDetail.poId = :poId AND m.endTimestamp IS NULL")
    List<POMilestone> findByPoDetail_PoId(@Param("poId") Long poId);

    // 🔹 Name & amount of active milestones
    @Query(value = "SELECT ms_id as msId, ms_name as msName, ms_amount as msAmount FROM po_milestone WHERE po_id = :poId AND end_timestamp IS NULL", nativeQuery = true)
    List<MilestoneInfo> findMilestoneInfoByPoId(@Param("poId") Long poId);

    // 🔹 Count only active milestones
    @Query(value = "SELECT COUNT(*) FROM po_milestone WHERE po_id = :poId AND end_timestamp IS NULL", nativeQuery = true)
    long countByPoId(@Param("poId") Long poId);

    // 🔹 Find amount of an active milestone
    @Query(value = "SELECT ms_amount FROM po_milestone WHERE po_id = :poId AND ms_id = :msId AND end_timestamp IS NULL", nativeQuery = true)
    Optional<Integer> findAmountByPoIdAndMsId(@Param("poId") Long poId, @Param("msId") Long msId);

    // 🔹 Sum of all active milestone amounts for a PO
    @Query(value = "SELECT COALESCE(SUM(ms_amount), 0) FROM po_milestone WHERE po_id = :poId AND end_timestamp IS NULL", nativeQuery = true)
    BigDecimal sumMilestoneAmountsByPoId(@Param("poId") Long poId);

    // 🔹 Check if active milestone exists by PO number and msId
    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM POMilestone m WHERE m.poDetail.poNumber = :poNumber AND m.msId = :msId AND m.endTimestamp IS NULL")
    boolean existsByPoDetail_PoNumberAndMsId(@Param("poNumber") String poNumber, @Param("msId") Long msId);

    // 🔹 Count active milestones by PO number
    @Query("SELECT COUNT(m) FROM POMilestone m WHERE m.poDetail.poNumber = :poNumber AND m.endTimestamp IS NULL")
    long countByPoDetail_PoNumber(@Param("poNumber") String poNumber);

    // 🔹 Get active milestone by PO number and msId
    @Query(value = "SELECT * FROM po_milestone WHERE po_number = :poNumber AND ms_id = :msId AND end_timestamp IS NULL", nativeQuery = true)
    Optional<POMilestone> findByPoNumberAndMsId(@Param("poNumber") String poNumber, @Param("msId") Long msId);


}
