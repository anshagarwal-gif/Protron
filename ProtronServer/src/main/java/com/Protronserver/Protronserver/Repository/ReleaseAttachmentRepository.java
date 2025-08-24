package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.DTOs.ReleaseAttachementDTO;
import com.Protronserver.Protronserver.Entities.ReleaseAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReleaseAttachmentRepository extends JpaRepository<ReleaseAttachment, Long> {

    @Query("SELECT new com.Protronserver.Protronserver.dto.AttachmentDTO(" +
            "ra.id, ra.fileName, ra.fileType, ra.uploadedAt) " +
            "FROM ReleaseAttachment ra WHERE ra.release.releaseId = :releaseId")
    List<ReleaseAttachementDTO> findAllByReleaseId(Long releaseId);
}
