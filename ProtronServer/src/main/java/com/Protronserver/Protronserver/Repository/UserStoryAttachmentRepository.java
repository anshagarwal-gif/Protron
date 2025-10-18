package com.Protronserver.Protronserver.Repository;


import com.Protronserver.Protronserver.Entities.UserStoryAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserStoryAttachmentRepository extends JpaRepository<UserStoryAttachment, Long> {

    List<UserStoryAttachment> findByUsId(String usId);
}
