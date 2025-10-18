package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.SolutionStoryAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SolutionStoryAttachmentRepository extends JpaRepository<SolutionStoryAttachment, Long> {
    List<SolutionStoryAttachment> findBySsId(String ssId);
}