package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.SprintAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SprintAttachmentRepository extends JpaRepository<SprintAttachment, Long> {
    @Query("SELECT new com.Protronserver.Protronserver.DTOs.SprintAttachmentDTO(sa.id, sa.fileName, sa.fileType, sa.uploadedAt) FROM SprintAttachment sa WHERE sa.sprintId = :sprintId")
    List<com.Protronserver.Protronserver.DTOs.SprintAttachmentDTO> findBySprintId(@Param("sprintId") Long sprintId);
}
