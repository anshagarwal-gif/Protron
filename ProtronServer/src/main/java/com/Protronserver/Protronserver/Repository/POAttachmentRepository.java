package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.POAttachments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface POAttachmentRepository extends JpaRepository<POAttachments, Long> {

    // Fetch all attachments (id + fileName)
    @Query("SELECT new com.Protronserver.Protronserver.DTOs.AttachmentMetaDTO(p.id, p.fileName) FROM POAttachments p")
    List<Object> findAllAttachmentMeta();

    // Fetch attachments by level and referenceId (id + fileName)
    @Query("SELECT new com.Protronserver.Protronserver.DTOs.AttachmentMetaDTO(p.id, p.fileName) FROM POAttachments p WHERE p.level = :level AND p.referenceId = :referenceId")
    List<Object> findAttachmentMetaByLevelAndReferenceId(String level, Long referenceId);
}
