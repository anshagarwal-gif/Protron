package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.Entities.UserStory;
import com.Protronserver.Protronserver.Entities.UserStoryAttachment;
import com.Protronserver.Protronserver.Repository.UserStoryAttachmentRepository;
import com.Protronserver.Protronserver.Repository.UserStoryRepository;
import com.Protronserver.Protronserver.ResultDTOs.UserStoryDto;
import com.Protronserver.Protronserver.Utils.CustomIdGenerator;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserStoryService {

    private final UserStoryRepository userStoryRepository;
    private final CustomIdGenerator idGenerator;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    @Autowired
    private UserStoryAttachmentRepository userStoryAttachmentRepository;

    public UserStoryService(UserStoryRepository userStoryRepository, CustomIdGenerator idGenerator) {
        this.userStoryRepository = userStoryRepository;
        this.idGenerator = idGenerator;
    }

    @Transactional
    public UserStory createUserStory(UserStoryDto storyDto) {

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

    // --- Download an attachment by ID ---
    @Transactional(readOnly = true)
    public Optional<UserStoryAttachment> downloadAttachment(Long attachmentId) {
        return userStoryAttachmentRepository.findById(attachmentId);
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

}