package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.POMilestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface POMilestoneRepository extends JpaRepository<POMilestone, Long> {

    List<POMilestone> findByPoDetail_PoId(Long poId);

}
