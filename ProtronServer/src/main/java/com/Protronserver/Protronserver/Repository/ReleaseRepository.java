package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.Release;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReleaseRepository extends JpaRepository<Release, Long> {
    List<Release> findAllByProjectIdAndEndTimestampIsNull(Long projectId);

    @Modifying
    @Query("UPDATE Release re SET re.projectId = :newProjectId, re.projectName = :newProjectName WHERE re.projectId = :oldProjectId")
    void updateProjectForReleases(Long oldProjectId, Long newProjectId, String newProjectName);
}

