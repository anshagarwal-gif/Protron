package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.POAttachments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface POAttachmentRepository extends JpaRepository<POAttachments, Long> {

    // Fetch all attachments (id + fileName)
    @Query("SELECT new com.Protronserver.Protronserver.DTOs.AttachmentMetaDTO(p.id, p.fileName) FROM POAttachments p")
    List<Object> findAllAttachmentMeta();

    // Fetch attachments by level and referenceId (id + fileName)
    @Query("SELECT new com.Protronserver.Protronserver.DTOs.AttachmentMetaDTO(p.id, p.fileName) FROM POAttachments p WHERE p.level = :level AND p.referenceId = :referenceId")
    List<Object> findAttachmentMetaByLevelAndReferenceId(String level, Long referenceId);

    @Query("SELECT a FROM POAttachments a WHERE a.level = :level AND a.referenceId = :referenceId")
    List<POAttachments> findByLevelAndReferenceId(@Param("level") String level, @Param("referenceId") Long referenceId);

    @Modifying
    @Query("DELETE FROM POAttachments a WHERE a.level = :level AND a.referenceId = :referenceId")
    void deleteByLevelAndReferenceId(@Param("level") String level, @Param("referenceId") Long referenceId);

    @Modifying
    @Query("UPDATE POAttachments a SET a.referenceId = :newId WHERE a.level = :level AND a.referenceId = :oldId")
    void updateReferenceId(@Param("level") String level, @Param("oldId") Long oldId, @Param("newId") Long newId);



}
