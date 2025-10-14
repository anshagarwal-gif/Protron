package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.SolutionStoryFilterDTO;
import com.Protronserver.Protronserver.Entities.Project;
import com.Protronserver.Protronserver.Entities.SolutionStory;
import com.Protronserver.Protronserver.Entities.SolutionStoryAttachment;
import com.Protronserver.Protronserver.Repository.*;
import com.Protronserver.Protronserver.ResultDTOs.SolutionStoryDto;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class SolutionStoryService {

    private final SolutionStoryRepository solutionStoryRepository;
    private final CustomIdGenerator idGenerator;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    @Autowired
    private SolutionStoryAttachmentRepository solutionStoryAttachmentRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserStoryRepository userStoryRepository;

    @Autowired
    private ReleaseRepository releaseRepository;

    @Autowired
    private SprintRepository sprintRepository;

    public SolutionStoryService(SolutionStoryRepository solutionStoryRepository,
            CustomIdGenerator idGenerator) {
        this.solutionStoryRepository = solutionStoryRepository;
        this.idGenerator = idGenerator;
    }

    private void validateIds(SolutionStoryDto storyDto) {

        // --- Validate projectId ---
        Long projectId = storyDto.projectId() != null ? storyDto.projectId() : null;
        if (projectId == null) {
            throw new RuntimeException("Invalid projectId format");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));
        String projectCode = project.getProjectCode();

        if (!projectRepository.existsByProjectCode(projectCode)) {
            throw new RuntimeException("Project not found with code: " + projectCode);
        }

        // --- Validate parentId ---
        String parentId = storyDto.parentId();
        if (parentId != null) {
            if (parentId.startsWith("PRJ-")) {
                if (!projectRepository.existsByProjectCode(parentId)) {
                    throw new RuntimeException("Parent Project not found with code: " + parentId);
                }
            } else if (parentId.startsWith("US-")) {
                if (!userStoryRepository.existsByUsId(parentId)) {
                    throw new RuntimeException("Parent UserStory not found with usId: " + parentId);
                }
            } else {
                throw new RuntimeException("Invalid parentId format. Must start with PRJ- or US-");
            }
        }

        // --- Validate releaseId ---
        if (storyDto.releaseId() != null && !releaseRepository.existsByReleaseId(storyDto.releaseId())) {
            throw new RuntimeException("Release not found with ID: " + storyDto.releaseId());
        }

        // --- Validate sprintId ---
        if (storyDto.sprintId() != null && !sprintRepository.existsBySprintId(storyDto.sprintId())) {
            throw new RuntimeException("Sprint not found with ID: " + storyDto.sprintId());
        }
    }

    // --- Create ---
    @Transactional
    public SolutionStory createSolutionStory(SolutionStoryDto storyDto) {

        validateIds(storyDto);

        Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
        String email = loggedInUserUtils.getLoggedInUser().getEmail();

        SolutionStory story = new SolutionStory();

        long sequence = solutionStoryRepository.countBySsIdStartingWith("SS");
        story.setSsId(idGenerator.generate("SS", sequence));
        story.setTenantId(tenantId);
        story.setProjectId(storyDto.projectId());
        story.setParentId(storyDto.parentId());
        story.setStatus(storyDto.status());
        story.setPriority(storyDto.priority());
        story.setSummary(storyDto.summary());
        story.setDescription(storyDto.description());
        story.setSystem(storyDto.system());
        story.setStoryPoints(storyDto.storyPoints());
        story.setAssignee(storyDto.assignee());
        story.setRelease(storyDto.releaseId());
        story.setSprint(storyDto.sprintId());
        story.setCreatedBy(email);
        story.setDateCreated(LocalDateTime.now());
        story.setStartTimestamp(LocalDateTime.now());
        story.setEndTimestamp(null);
        story.setLastUpdatedBy(null);

        return solutionStoryRepository.save(story);
    }

    // --- Update ---
    @Transactional
    public SolutionStory updateSolutionStory(String ssId, SolutionStoryDto updatedDto) {

        validateIds(updatedDto);

        String email = loggedInUserUtils.getLoggedInUser().getEmail();

        SolutionStory oldStory = solutionStoryRepository
                .findTopBySsIdAndEndTimestampIsNullOrderByStartTimestampDesc(ssId)
                .orElseThrow(() -> new RuntimeException("Active SolutionStory not found with ssId: " + ssId));

        oldStory.setEndTimestamp(LocalDateTime.now());
        oldStory.setLastUpdatedBy(email);
        solutionStoryRepository.save(oldStory);

        SolutionStory newVersion = new SolutionStory();
        newVersion.setSsId(oldStory.getSsId());
        newVersion.setTenantId(oldStory.getTenantId());
        newVersion.setProjectId(oldStory.getProjectId());
        newVersion.setParentId(oldStory.getParentId());
        newVersion.setStatus(updatedDto.status());
        newVersion.setPriority(updatedDto.priority());
        newVersion.setSummary(updatedDto.summary());
        newVersion.setDescription(updatedDto.description());
        newVersion.setSystem(updatedDto.system());
        newVersion.setStoryPoints(updatedDto.storyPoints());
        newVersion.setAssignee(updatedDto.assignee());
        newVersion.setRelease(updatedDto.releaseId());
        newVersion.setSprint(updatedDto.sprintId());
        newVersion.setCreatedBy(oldStory.getCreatedBy());
        newVersion.setDateCreated(oldStory.getDateCreated());

        newVersion.setStartTimestamp(LocalDateTime.now());
        newVersion.setEndTimestamp(null);
        newVersion.setLastUpdatedBy(null);

        return solutionStoryRepository.save(newVersion);
    }

    // --- Delete (soft delete) ---
    @Transactional
    public void deleteSolutionStory(String ssId) {
        String email = loggedInUserUtils.getLoggedInUser().getEmail();

        SolutionStory story = solutionStoryRepository
                .findTopBySsIdAndEndTimestampIsNullOrderByStartTimestampDesc(ssId)
                .orElseThrow(() -> new RuntimeException("Active SolutionStory not found with ssId: " + ssId));

        story.setEndTimestamp(LocalDateTime.now());
        story.setLastUpdatedBy(email);
        solutionStoryRepository.save(story);
    }

    // --- Get all active (all tenants) ---
    @Transactional(readOnly = true)
    public List<SolutionStory> getAllActiveSolutionStories() {
        return solutionStoryRepository.findAll()
                .stream()
                .filter(story -> story.getEndTimestamp() == null)
                .toList();
    }

    // --- Get all active for a tenant ---
    @Transactional(readOnly = true)
    public List<SolutionStory> getAllActiveSolutionStoriesByTenant(Long tenantId) {
        return solutionStoryRepository.findByTenantIdAndEndTimestampIsNull(tenantId);
    }

    // --- Get active for logged-in tenant ---
    @Transactional(readOnly = true)
    public List<SolutionStory> getActiveSolutionStoriesForLoggedInTenant() {
        Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
        return solutionStoryRepository.findByTenantIdAndEndTimestampIsNull(tenantId);
    }

    // --- Get by ID ---
    @Transactional(readOnly = true)
    public SolutionStory getActiveSolutionStoryById(Long id) {
        return solutionStoryRepository.findById(id)
                .filter(story -> story.getEndTimestamp() == null)
                .orElseThrow(() -> new RuntimeException("Active SolutionStory not found with ID: " + id));
    }

    // --- Get by ssId ---
    @Transactional(readOnly = true)
    public SolutionStory getActiveSolutionStoryBySsId(String ssId) {
        return solutionStoryRepository.findTopBySsIdAndEndTimestampIsNullOrderByStartTimestampDesc(ssId)
                .orElseThrow(() -> new RuntimeException("Active SolutionStory not found with ssId: " + ssId));
    }

    @Transactional
    public SolutionStoryAttachment addAttachment(String ssId, MultipartFile file) throws IOException {
        SolutionStoryAttachment attachment = new SolutionStoryAttachment();
        attachment.setSsId(ssId);
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFileType(file.getContentType());
        attachment.setFileSize(file.getSize());
        attachment.setData(file.getBytes());
        attachment.setUploadedAt(LocalDateTime.now());
        return solutionStoryAttachmentRepository.save(attachment);
    }

    @Transactional(readOnly = true)
    public List<SolutionStoryAttachment> getAttachments(String ssId) {
        return solutionStoryAttachmentRepository.findBySsId(ssId);
    }

    @Transactional(readOnly = true)
    public Optional<SolutionStoryAttachment> downloadAttachment(Long attachmentId) {
        return solutionStoryAttachmentRepository.findById(attachmentId);
    }

    @Transactional
    public void deleteAttachment(Long attachmentId) {
        solutionStoryAttachmentRepository.deleteById(attachmentId);
    }

    @Transactional(readOnly = true)
    public List<SolutionStory> getActiveSolutionStoriesByParentId(String parentId) {
        Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
        return solutionStoryRepository.findByTenantIdAndParentIdAndEndTimestampIsNull(tenantId, parentId);
    }

    public List<SolutionStory> getFilteredStories(SolutionStoryFilterDTO filter) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<SolutionStory> cq = cb.createQuery(SolutionStory.class);
        Root<SolutionStory> root = cq.from(SolutionStory.class);

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
            LocalDate createdDate = filter.getCreatedDate().toLocalDate();
            LocalDateTime startOfDay = createdDate.atStartOfDay();
            LocalDateTime endOfDay = createdDate.atTime(LocalTime.MAX);

            predicates.add(cb.between(root.get("dateCreated"), startOfDay, endOfDay));
        }

        cq.where(predicates.toArray(new Predicate[0]));

        TypedQuery<SolutionStory> query = entityManager.createQuery(cq);
        return query.getResultList();
    }

}
