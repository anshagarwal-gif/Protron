package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.Entities.UserAccessRights;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserAccessRightsRepository extends JpaRepository<UserAccessRights, Long> {
    void deleteByUser(User user);
}
