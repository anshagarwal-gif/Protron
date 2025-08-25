package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.DTOs.ReleaseAttachementDTO;
import com.Protronserver.Protronserver.Entities.ReleaseAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReleaseAttachmentRepository extends JpaRepository<ReleaseAttachment, Long> {

    @Query("SELECT new com.Protronserver.Protronserver.DTOs.ReleaseAttachementDTO(" +
            "ra.id, ra.fileName, ra.fileType, ra.uploadedAt) " +
            "FROM ReleaseAttachment ra WHERE ra.releaseId = :releaseId")
    List<ReleaseAttachementDTO> findAllByReleaseId(Long releaseId);
}
