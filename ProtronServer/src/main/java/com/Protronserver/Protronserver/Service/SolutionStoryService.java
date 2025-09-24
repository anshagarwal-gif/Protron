package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.Entities.SolutionStory;
import com.Protronserver.Protronserver.Entities.SolutionStoryAttachment;
import com.Protronserver.Protronserver.Repository.SolutionStoryAttachmentRepository;
import com.Protronserver.Protronserver.Repository.SolutionStoryRepository;
import com.Protronserver.Protronserver.ResultDTOs.SolutionStoryDto;
import com.Protronserver.Protronserver.Utils.CustomIdGenerator;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class SolutionStoryService {

    private final SolutionStoryRepository solutionStoryRepository;
    private final CustomIdGenerator idGenerator;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    @Autowired
    private SolutionStoryAttachmentRepository solutionStoryAttachmentRepository;

    public SolutionStoryService(SolutionStoryRepository solutionStoryRepository,
                                CustomIdGenerator idGenerator) {
        this.solutionStoryRepository = solutionStoryRepository;
        this.idGenerator = idGenerator;
    }

    // --- Create ---
    @Transactional
    public SolutionStory createSolutionStory(SolutionStoryDto storyDto) {
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

    @Transactional
    public void deleteAttachment(Long attachmentId) {
        solutionStoryAttachmentRepository.deleteById(attachmentId);
    }

    @Transactional(readOnly = true)
    public List<SolutionStory> getActiveSolutionStoriesByParentId(String parentId) {
        Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
        return solutionStoryRepository.findByTenantIdAndParentIdAndEndTimestampIsNull(tenantId, parentId);
    }

}
