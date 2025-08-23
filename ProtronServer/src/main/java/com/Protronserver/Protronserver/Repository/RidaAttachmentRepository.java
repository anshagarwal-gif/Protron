package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.RidaAttachment;
import com.Protronserver.Protronserver.ResultDTOs.RidaAttachmentResultDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RidaAttachmentRepository extends JpaRepository<RidaAttachment, Long> {

    @Query(value = """
        SELECT new com.Protronserver.Protronserver.ResultDTOs.RidaAttachmentResultDTO(
            ra.id, ra.fileName, ra.contentType, ra.uploadedAt
        )
        FROM RidaAttachment ra
        WHERE ra.ridaId = :ridaId
    """)
    List<RidaAttachmentResultDTO> findAllByRidaId(@Param("ridaId") Long ridaId);
}
