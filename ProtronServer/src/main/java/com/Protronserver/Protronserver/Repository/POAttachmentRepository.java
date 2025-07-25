package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.POAttachments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface POAttachmentRepository extends JpaRepository<POAttachments, Long> {

    Optional<POAttachments> findByPoNumber(String poNumber);
}
