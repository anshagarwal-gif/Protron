package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.Project;
import com.Protronserver.Protronserver.Entities.SolutionStory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
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

    List<SolutionStory> findByTenantIdAndReleaseIdAndEndTimestampIsNull(Long tenantId, Long releaseId);

    List<SolutionStory> findByTenantIdAndSprintAndEndTimestampIsNull(Long tenantId, Long sprint);

    @Modifying
    @Query("UPDATE SolutionStory s SET s.projectId = :newProjectId WHERE s.projectId = :oldProjectId")
    void updateProjectForSolutionStories(Long oldProjectId, Long newProjectId);

}

