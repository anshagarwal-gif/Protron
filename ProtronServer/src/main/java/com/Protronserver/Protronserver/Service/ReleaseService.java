package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.Entities.Release;
import com.Protronserver.Protronserver.Entities.ReleaseAttachment;
import com.Protronserver.Protronserver.Repository.ReleaseRepository;
import com.Protronserver.Protronserver.Repository.ReleaseAttachmentRepository;
import com.Protronserver.Protronserver.DTOs.ReleaseAttachementDTO;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ReleaseService {

    @Autowired
    private ReleaseRepository releaseRepository;

    @Autowired
    private ReleaseAttachmentRepository releaseAttachmentRepository;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    // --- Release CRUD ---

    public List<Release> getAllReleases() {
        return releaseRepository.findAll();
    }

    public Optional<Release> getReleaseById(Long id) {
        return releaseRepository.findById(id);
    }

    public Release createRelease(Release release) {
        release.setCreatedOn(LocalDateTime.now());
        release.setStartTimestamp(LocalDateTime.now());
        release.setEndTimestamp(null);
        release.setLastUpdatedBy(null);
        return releaseRepository.save(release);
    }

    @Transactional
    public Release editRelease(Release updatedRelease, Long releaseId) {
        Release oldRelease = releaseRepository.findById(releaseId)
                .orElseThrow(() -> new RuntimeException("Release not found"));

        String loggedInUserEmail = loggedInUserUtils.getLoggedInUser().getEmail();

        // Close old release
        oldRelease.setEndTimestamp(LocalDateTime.now());
        oldRelease.setLastUpdatedBy(loggedInUserEmail);
        releaseRepository.save(oldRelease);

        // Create new release entry
        Release newRelease = new Release();
        newRelease.setReleaseName(updatedRelease.getReleaseName());
        newRelease.setTenantId(updatedRelease.getTenantId());
        newRelease.setProjectId(oldRelease.getProjectId());
        newRelease.setProjectName(oldRelease.getProjectName());
        newRelease.setStartDate(updatedRelease.getStartDate());
        newRelease.setEndDate(updatedRelease.getEndDate());
        newRelease.setDescription(updatedRelease.getDescription());
        newRelease.setCreatedOn(LocalDateTime.now());
        newRelease.setStartTimestamp(LocalDateTime.now());
        newRelease.setEndTimestamp(null);
        newRelease.setLastUpdatedBy(null);

        return releaseRepository.save(newRelease);
    }

    public void deleteRelease(Long id) {
        Release oldRelease = releaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Release not found"));

        String loggedInUserEmail = loggedInUserUtils.getLoggedInUser().getEmail();

        // Close old release
        oldRelease.setEndTimestamp(LocalDateTime.now());
        oldRelease.setLastUpdatedBy(loggedInUserEmail);
        releaseRepository.save(oldRelease);
    }

    // --- Attachments ---

    public ReleaseAttachment addAttachment(Long releaseId, MultipartFile file) throws IOException {
        Release release = releaseRepository.findById(releaseId)
                .orElseThrow(() -> new RuntimeException("Release not found"));

        ReleaseAttachment attachment = new ReleaseAttachment();
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFileType(file.getContentType());
        attachment.setFileSize(file.getSize());
        attachment.setData(file.getBytes());
        attachment.setUploadedAt(LocalDateTime.now());
        attachment.setReleaseId(release.getReleaseId());

        return releaseAttachmentRepository.save(attachment);
    }

    public List<ReleaseAttachementDTO> getAttachments(Long releaseId) {
        return releaseAttachmentRepository.findAllByReleaseId(releaseId);
    }

    public void deleteAttachment(Long attachmentId) {
        releaseAttachmentRepository.deleteById(attachmentId);
    }

    public List<Release> getAllReleasesByProject(Long projectId) {
        return releaseRepository.findAllByProjectIdAndEndTimestampIsNull(projectId);
    }
}
