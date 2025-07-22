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

    List<POMilestone> findByPoDetail_PoId(Long poId);

    // Finds all milestones for a PO, but only fetches name and amount
    @Query(value = "SELECT ms_id as msId, ms_name as msName, ms_amount as msAmount FROM po_milestone WHERE po_id = :poId", nativeQuery = true)
    List<MilestoneInfo> findMilestoneInfoByPoId(Long poId);

    @Query(value = "SELECT COUNT(*) FROM po_milestone WHERE po_id = :poId", nativeQuery = true)
    long countByPoId(Long poId);

    @Query(value = "SELECT ms_amount FROM po_milestone WHERE po_id = :poId AND ms_name = :msName", nativeQuery = true)
    Optional<Integer> findAmountByPoIdAndMsName(Long poId, String msName);

    @Query(value = "SELECT COALESCE(SUM(ms_amount), 0) FROM po_milestone WHERE po_id = :poId", nativeQuery = true)
    BigDecimal sumMilestoneAmountsByPoId(Long poId);

    /**
     * Check if milestone exists for a PO by PO number and milestone name
     */
    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM POMilestone m WHERE m.poDetail.poNumber = :poNumber AND m.msName = :msName")
    boolean existsByPoDetail_PoNumberAndMsName(@Param("poNumber") String poNumber, @Param("msName") String msName);

    /**
     * Count milestones by PO number
     */
    @Query("SELECT COUNT(m) FROM POMilestone m WHERE m.poDetail.poNumber = :poNumber")
    long countByPoDetail_PoNumber(@Param("poNumber") String poNumber);

}
