package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.UserStoryFilterDTO;
import com.Protronserver.Protronserver.Entities.UserStory;
import com.Protronserver.Protronserver.Entities.UserStoryAttachment;
import com.Protronserver.Protronserver.Repository.*;
import com.Protronserver.Protronserver.ResultDTOs.UserStoryDto;
import com.Protronserver.Protronserver.Utils.CustomIdGenerator;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class UserStoryService {

    private final UserStoryRepository userStoryRepository;
    private final CustomIdGenerator idGenerator;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    @Autowired
    private UserStoryAttachmentRepository userStoryAttachmentRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ReleaseRepository releaseRepository;

    @Autowired
    private SprintRepository sprintRepository;

    public UserStoryService(UserStoryRepository userStoryRepository, CustomIdGenerator idGenerator) {
        this.userStoryRepository = userStoryRepository;
        this.idGenerator = idGenerator;
    }

    @Transactional
    public UserStory createUserStory(UserStoryDto storyDto) {

        validateIds(storyDto);

        Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
        String email = loggedInUserUtils.getLoggedInUser().getEmail();

        UserStory newStory = new UserStory();

        // Generate custom ID
        long sequence = userStoryRepository.countByUsIdStartingWith("US");
        newStory.setUsId(idGenerator.generate("US", sequence));
        newStory.setTenantId(tenantId);
        newStory.setProjectId(storyDto.projectId());
        newStory.setParentId(storyDto.parentId());
        newStory.setStatus(storyDto.status());
        newStory.setPriority(storyDto.priority());
        newStory.setSummary(storyDto.summary());
        newStory.setAsA(storyDto.asA());
        newStory.setIWantTo(storyDto.iWantTo());
        newStory.setSoThat(storyDto.soThat());
        newStory.setAcceptanceCriteria(storyDto.acceptanceCriteria());
        newStory.setSystem(storyDto.system());
        newStory.setStoryPoints(storyDto.storyPoints());
        newStory.setAssignee(storyDto.assignee());
        newStory.setRelease(storyDto.releaseId());
        newStory.setSprint(storyDto.sprintId());
        newStory.setCreatedBy(email);
        newStory.setDateCreated(LocalDateTime.now());
        newStory.setStartTimestamp(LocalDateTime.now());
        newStory.setEndTimestamp(null);
        newStory.setLastUpdatedBy(null);

        UserStory savedStory = userStoryRepository.save(newStory);
        return savedStory;
    }

    @Transactional
    public UserStory updateUserStory(String usId, UserStoryDto updatedStoryDto) {
        // 1. Find the current active record to "close" it

        validateIds(updatedStoryDto);

        String email = loggedInUserUtils.getLoggedInUser().getEmail();

        UserStory oldStory = userStoryRepository.findTopByUsIdAndEndTimestampIsNullOrderByStartTimestampDesc(usId)
                .orElseThrow(() -> new RuntimeException("Active UserStory not found with ID: " + usId));

        // 2. "Close" the old record
        oldStory.setEndTimestamp(LocalDateTime.now());
        oldStory.setLastUpdatedBy(email);
        userStoryRepository.save(oldStory);

        // 3. Create a new record with the updated values
        UserStory newStoryVersion = new UserStory();
        // Copy all properties from the old version to the new one
        newStoryVersion.setUsId(oldStory.getUsId());
        newStoryVersion.setTenantId(oldStory.getTenantId());
        newStoryVersion.setProjectId(oldStory.getProjectId());
        newStoryVersion.setParentId(oldStory.getParentId());
        newStoryVersion.setStatus(updatedStoryDto.status());
        newStoryVersion.setPriority(updatedStoryDto.priority());
        newStoryVersion.setSummary(updatedStoryDto.summary());
        newStoryVersion.setAsA(updatedStoryDto.asA());
        newStoryVersion.setIWantTo(updatedStoryDto.iWantTo());
        newStoryVersion.setSoThat(updatedStoryDto.soThat());
        newStoryVersion.setAcceptanceCriteria(updatedStoryDto.acceptanceCriteria());
        newStoryVersion.setSystem(updatedStoryDto.system());
        newStoryVersion.setStoryPoints(updatedStoryDto.storyPoints());
        newStoryVersion.setAssignee(updatedStoryDto.assignee());
        newStoryVersion.setRelease(updatedStoryDto.releaseId());
        newStoryVersion.setSprint(updatedStoryDto.sprintId());
        newStoryVersion.setCreatedBy(oldStory.getCreatedBy());
        newStoryVersion.setDateCreated(oldStory.getDateCreated());

        newStoryVersion.setStartTimestamp(LocalDateTime.now());
        newStoryVersion.setEndTimestamp(null);
        newStoryVersion.setLastUpdatedBy(null);

        UserStory savedStory = userStoryRepository.save(newStoryVersion);
        return savedStory;
    }

    @Transactional
    public void deleteUserStory(String usId) {

        String email = loggedInUserUtils.getLoggedInUser().getEmail();

        UserStory storyToDelete = userStoryRepository.findTopByUsIdAndEndTimestampIsNullOrderByStartTimestampDesc(usId)
                .orElseThrow(() -> new RuntimeException("Active UserStory not found with ID: " + usId));

        // Perform a soft delete by "closing" the record
        storyToDelete.setEndTimestamp(LocalDateTime.now());
        storyToDelete.setLastUpdatedBy(email);
        userStoryRepository.save(storyToDelete);
    }

    @Transactional(readOnly = true)
    public List<UserStory> getActiveUserStoriesForLoggedInTenant() {
        Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
        return userStoryRepository.findByTenantIdAndEndTimestampIsNull(tenantId);
    }

    @Transactional(readOnly = true)
    public UserStory getActiveUserStoryById(Long id) {
        return userStoryRepository.findByIdAndEndTimestampIsNull(id)
                .orElseThrow(() -> new RuntimeException("Active UserStory not found with ID: " + id));
    }

    @Transactional(readOnly = true)
    public UserStory getActiveUserStoryByUsId(String usId) {
        return userStoryRepository.findTopByUsIdAndEndTimestampIsNullOrderByStartTimestampDesc(usId)
                .orElseThrow(() -> new RuntimeException("Active UserStory not found with usId: " + usId));
    }

    @Transactional
    public UserStoryAttachment addAttachment(String usId, MultipartFile file) throws IOException {
        UserStoryAttachment attachment = new UserStoryAttachment();
        attachment.setUsId(usId);
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFileType(file.getContentType());
        attachment.setFileSize(file.getSize());
        attachment.setData(file.getBytes());
        attachment.setUploadedAt(LocalDateTime.now());
        return userStoryAttachmentRepository.save(attachment);
    }

    // --- Get all attachments for a user story ---
    @Transactional(readOnly = true)
    public List<UserStoryAttachment> getAttachments(String usId) {
        return userStoryAttachmentRepository.findByUsId(usId);
    }

    // --- Delete an attachment by ID ---
    @Transactional
    public void deleteAttachment(Long attachmentId) {
        userStoryAttachmentRepository.deleteById(attachmentId);
    }

    @Transactional(readOnly = true)
    public List<UserStory> getActiveUserStoriesByParentId(String parentId) {
        Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
        return userStoryRepository.findByTenantIdAndParentIdAndEndTimestampIsNull(tenantId, parentId);
    }

    private void validateIds(UserStoryDto storyDto) {
        // --- Validate projectId ---
        String projectCode = storyDto.projectId() != null ? storyDto.projectId().toString() : null;
        if (projectCode == null || !projectCode.startsWith("PRJ-")) {
            throw new RuntimeException("Invalid projectId format. Must start with 'PRJ-'");
        }
        if (!projectRepository.existsByProjectCode(projectCode)) {
            throw new RuntimeException("Project not found with code: " + projectCode);
        }

        // --- Validate parentId ---
        if (storyDto.parentId() != null) {
            if (!storyDto.parentId().startsWith("PRJ-")) {
                throw new RuntimeException("Invalid parentId format. Must start with 'PRJ-'");
            }
            if (!projectRepository.existsByProjectCode(storyDto.parentId())) {
                throw new RuntimeException("Parent project not found with code: " + storyDto.parentId());
            }
        }

        // --- Validate releaseId ---
        if (storyDto.releaseId() != null && !releaseRepository.existsByReleaseId(storyDto.releaseId())) {
            throw new RuntimeException("Release not found with id: " + storyDto.releaseId());
        }

        // --- Validate sprintId ---
        if (storyDto.sprintId() != null && !sprintRepository.existsBySprintId(storyDto.sprintId())) {
            throw new RuntimeException("Sprint not found with id: " + storyDto.sprintId());
        }
    }

    public List<UserStory> getFilteredStories(UserStoryFilterDTO filter) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<UserStory> cq = cb.createQuery(UserStory.class);
        Root<UserStory> root = cq.from(UserStory.class);

        List<Predicate> predicates = new ArrayList<>();

        // Always fetch only active (not soft-deleted)
        predicates.add(cb.isNull(root.get("endTimestamp")));
        predicates.add(cb.equal(root.get("tenantId"), loggedInUserUtils.getLoggedInUser().getTenant().getTenantId()));

        if (filter.getProjectId() != null) {
            predicates.add(cb.equal(root.get("projectId"), filter.getProjectId()));

            if (filter.getSprint() != null) {
                predicates.add(cb.equal(root.get("sprint"), filter.getSprint()));
            }

            if (filter.getReleaseId() != null) {
                predicates.add(cb.equal(root.get("releaseId"), filter.getReleaseId()));
            }
        }

        if (filter.getParentId() != null) {
            predicates.add(cb.like(root.get("parentId"), filter.getParentId() + "%"));
        }

        if (filter.getStatus() != null) {
            predicates.add(cb.equal(root.get("status"), filter.getStatus()));
        }

        if (filter.getAssignee() != null) {
            predicates.add(cb.equal(root.get("assignee"), filter.getAssignee()));
        }

        if (filter.getCreatedBy() != null) {
            predicates.add(cb.equal(root.get("createdBy"), filter.getCreatedBy()));
        }

        if (filter.getCreatedDate() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("dateCreated"), filter.getCreatedDate()));
        }

        cq.where(predicates.toArray(new Predicate[0]));

        TypedQuery<UserStory> query = entityManager.createQuery(cq);
        return query.getResultList();
    }

}