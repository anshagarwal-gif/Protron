package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.Release;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReleaseRepository extends JpaRepository<Release, Long> {
    List<Release> findAllByProjectIdAndEndTimestampIsNull(Long projectId);
}

