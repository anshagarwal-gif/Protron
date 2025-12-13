// ...existing code...
package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.Entities.*;
import com.Protronserver.Protronserver.Repository.SolutionStoryRepository;
import com.Protronserver.Protronserver.Repository.SprintRepository;
import com.Protronserver.Protronserver.Repository.SprintAttachmentRepository;
import com.Protronserver.Protronserver.DTOs.SprintAttachmentDTO;
import com.Protronserver.Protronserver.Repository.UserStoryRepository;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SprintService {
    // Bulk update project for Sprint attachments
    public void updateProjectForAttachments(List<Long> attachmentIds, Long projectId) {
        List<SprintAttachment> attachments = sprintAttachmentRepository.findAllById(attachmentIds);
        if (attachments.isEmpty()) {
            throw new RuntimeException("No attachments found for given IDs");
        }
        for (SprintAttachment attachment : attachments) {
            attachment.setSprintId(projectId); // assuming sprintId here is project mapping
        }
        sprintAttachmentRepository.saveAll(attachments);
    }

    @Autowired
    private SprintRepository sprintRepository;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    @Autowired
    private SprintAttachmentRepository sprintAttachmentRepository;

    @Autowired
    private UserStoryRepository userStoryRepository;

    @Autowired
    private SolutionStoryRepository solutionStoryRepository;

    public List<Sprint> getAllSprints() {
        return sprintRepository.findAll();
    }

    public Optional<Sprint> getSprintById(Long id) {
        return sprintRepository.findById(id);
    }

    public Sprint createSprint(Sprint sprint) {
        Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
        sprint.setTenantId(tenantId);
        sprint.setCreatedOn(LocalDateTime.now());
        sprint.setStartTimestamp(LocalDateTime.now());
        sprint.setEndTimestamp(null);
        sprint.setLastUpdatedBy(null);
        return sprintRepository.save(sprint);
    }

    public Sprint updateSprint(Long id, Sprint updatedSprint) {
        Sprint oldSprint = sprintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));
        String loggedInUserEmail = loggedInUserUtils.getLoggedInUser().getEmail();
        // Close old sprint
        oldSprint.setEndTimestamp(LocalDateTime.now());
        oldSprint.setLastUpdatedBy(loggedInUserEmail);
        sprintRepository.save(oldSprint);

        // Create new sprint entry
        Sprint newSprint = new Sprint();
        newSprint.setSprintName(updatedSprint.getSprintName());
        newSprint.setTenantId(oldSprint.getTenantId());
        newSprint.setProjectId(oldSprint.getProjectId());
        newSprint.setStartDate(updatedSprint.getStartDate());
        newSprint.setEndDate(updatedSprint.getEndDate());
        newSprint.setDescription(updatedSprint.getDescription());
        newSprint.setCreatedOn(LocalDateTime.now());
        newSprint.setStartTimestamp(LocalDateTime.now());
        newSprint.setEndTimestamp(null);
        newSprint.setLastUpdatedBy(null);

        List<UserStory> userStories = userStoryRepository
                .findByTenantIdAndSprintAndEndTimestampIsNull(oldSprint.getTenantId(), oldSprint.getSprintId());

        for (UserStory us : userStories) {
            us.setSprint(newSprint.getSprintId());
        }
        userStoryRepository.saveAll(userStories);

        // --- 🔹 Reassign all SolutionStories ---
        List<SolutionStory> solutionStories = solutionStoryRepository
                .findByTenantIdAndSprintAndEndTimestampIsNull(oldSprint.getTenantId(), oldSprint.getSprintId());

        for (SolutionStory ss : solutionStories) {
            ss.setSprint(newSprint.getSprintId());
        }
        solutionStoryRepository.saveAll(solutionStories);

        return sprintRepository.save(newSprint);
    }

    public void deleteSprint(Long id) {
        Sprint oldSprint = sprintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));
        String loggedInUserEmail = loggedInUserUtils.getLoggedInUser().getEmail();
        // Close old sprint
        oldSprint.setEndTimestamp(LocalDateTime.now());
        oldSprint.setLastUpdatedBy(loggedInUserEmail);
        sprintRepository.save(oldSprint);
    }
    // --- Attachments ---
    public SprintAttachment addAttachment(Long sprintId, MultipartFile file) throws IOException {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));
        SprintAttachment attachment = new SprintAttachment();
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFileType(file.getContentType());
        attachment.setFileSize(file.getSize());
        attachment.setData(file.getBytes());
        attachment.setUploadedAt(LocalDateTime.now());
        attachment.setSprintId(sprint.getSprintId());
        return sprintAttachmentRepository.save(attachment);
    }

    public List<SprintAttachmentDTO> getAttachments(Long sprintId) {
        return sprintAttachmentRepository.findBySprintId(sprintId);
    }

    public SprintAttachment getAttachment(Long attachmentId) {
        return sprintAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));
    }

    public void deleteAttachment(Long attachmentId) {
        sprintAttachmentRepository.deleteById(attachmentId);
    }

    public List<Sprint> getSprintsByProjectId(Long projectId) {
        return sprintRepository.findAllByProjectIdAndEndTimestampIsNull(projectId);
    }

    public void copyAttachments(List<Long> sourceAttachmentIds, Long targetSprintId) {
        List<SprintAttachment> sourceAttachments = sprintAttachmentRepository.findAllById(sourceAttachmentIds);

        if (sourceAttachments.isEmpty()) {
            return;
        }

        for (SprintAttachment source : sourceAttachments) {
            SprintAttachment copy = new SprintAttachment();
            copy.setFileName(source.getFileName());
            copy.setFileType(source.getFileType());
            copy.setFileSize(source.getFileSize());
            copy.setData(source.getData());
            copy.setUploadedAt(LocalDateTime.now());
            copy.setSprintId(targetSprintId);
            sprintAttachmentRepository.save(copy);
        }
    }
}
