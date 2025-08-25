package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, Long> {
    List<Sprint> findAllByProjectIdAndEndTimestampIsNull(Long projectId);
}
