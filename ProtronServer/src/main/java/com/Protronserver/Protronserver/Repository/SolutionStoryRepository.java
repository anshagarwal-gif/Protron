package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.SolutionStory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SolutionStoryRepository extends JpaRepository<SolutionStory, Long> {

    List<SolutionStory> findByTenantIdAndEndTimestampIsNull(Long tenantId);

    Optional<SolutionStory> findTopBySsIdAndEndTimestampIsNullOrderByStartTimestampDesc(String ssId);

    long countBySsIdStartingWith(String prefix);

    List<SolutionStory> findByTenantIdAndParentIdAndEndTimestampIsNull(Long tenantId, String parentId);

    boolean existsBySsId(String ssId);

}

