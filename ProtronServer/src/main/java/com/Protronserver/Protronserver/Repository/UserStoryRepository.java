package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.UserStory;
import com.Protronserver.Protronserver.Entities.UserStoryAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserStoryRepository extends JpaRepository<UserStory, Long> {

    /**
     * Finds all active (not soft-deleted) stories for a given tenant.
     * 
     * @param tenantId The ID of the tenant.
     * @return A list of active user stories.
     */
    List<UserStory> findByTenantIdAndEndTimestampIsNull(Long tenantId);

    /**
     * Finds the current, active version of a story by its custom business ID.
     * It orders by start time descending to get the most recent one first.
     * 
     * @param usId The custom business ID (e.g., "US-00001").
     * @return An Optional containing the active user story if found.
     */
    Optional<UserStory> findTopByUsIdAndEndTimestampIsNullOrderByStartTimestampDesc(String usId);

    /**
     * Counts how many stories exist with a given prefix. Used for generating a
     * unique sequence number.
     * 
     * @param prefix The prefix to check (e.g., "US").
     * @return The count of existing stories.
     */
    long countByUsIdStartingWith(String prefix);

    Optional<UserStory> findByIdAndEndTimestampIsNull(Long id);

    List<UserStory> findByTenantIdAndParentIdAndEndTimestampIsNull(Long tenantId, String parentId);

}
