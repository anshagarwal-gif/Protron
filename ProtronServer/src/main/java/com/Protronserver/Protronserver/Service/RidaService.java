package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.RidaEditRequestDTO;
import com.Protronserver.Protronserver.DTOs.RidaRequestDTO;
import com.Protronserver.Protronserver.Entities.*;
import com.Protronserver.Protronserver.Repository.ProjectRepository;
import com.Protronserver.Protronserver.Repository.RidaAttachmentRepository;
import com.Protronserver.Protronserver.Repository.RidaRepository;
import com.Protronserver.Protronserver.Repository.TenantRepository;
import com.Protronserver.Protronserver.ResultDTOs.RidaAttachmentResultDTO;
import com.Protronserver.Protronserver.ResultDTOs.RidaResultDTO;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RidaService {

    private final RidaRepository ridaRepository;
    private final RidaAttachmentRepository attachmentRepository;
    private final ProjectRepository projectRepository;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    public RidaService(RidaRepository ridaRepository, RidaAttachmentRepository attachmentRepository,
                       ProjectRepository projectRepository, TenantRepository tenantRepository) {
        this.ridaRepository = ridaRepository;
        this.attachmentRepository = attachmentRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional
    public Rida addRida(RidaRequestDTO dto, Long projectId) {

        Long currentTenant = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Rida rida = new Rida();
        rida.setProject(project);
        rida.setTenantId(currentTenant);
        rida.setProjectName(dto.getProjectName());
        rida.setMeetingReference(dto.getMeetingReference());
        rida.setItemDescription(dto.getItemDescription());
        rida.setType(dto.getType());
        rida.setRaisedBy(dto.getRaisedBy());
        rida.setOwner(dto.getOwner());
        rida.setStatus(dto.getStatus());
        rida.setRemarks(dto.getRemarks());
        rida.setStartTimestamp(LocalDateTime.now());
        rida.setEndTimestamp(null);
        rida.setLastUpdatedBy(null);

        return ridaRepository.save(rida);
    }

    @Transactional
    public Rida editRida(RidaEditRequestDTO dto, Long ridaId) {

        Rida rida = ridaRepository.findById(ridaId)
                .orElseThrow(() -> new RuntimeException("Rida not found"));

        String loggedInUserEmail = loggedInUserUtils.getLoggedInUser().getEmail();

        if(loggedInUserEmail != null){
            rida.setEndTimestamp(LocalDateTime.now());
            rida.setLastUpdatedBy(loggedInUserEmail);
        }

        rida = ridaRepository.save(rida);

        Rida newRida = new Rida();

        newRida.setMeetingReference(dto.getMeetingReference());
        newRida.setItemDescription(dto.getItemDescription());
        newRida.setType(dto.getType());
        newRida.setRaisedBy(dto.getRaisedBy());
        newRida.setOwner(dto.getOwner());
        newRida.setStatus(dto.getStatus());
        newRida.setRemarks(dto.getRemarks());
        newRida.setTenantId(rida.getTenantId());
        newRida.setProject(rida.getProject());
        newRida.setProjectName(dto.getProjectName());
        newRida.setStartTimestamp(LocalDateTime.now());
        newRida.setEndTimestamp(null);
        newRida.setLastUpdatedBy(null);

        return ridaRepository.save(newRida);
    }

    public void deleteRida(Long id) {
        Rida rida = ridaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rida not found"));

        String loggedInUserEmail = loggedInUserUtils.getLoggedInUser().getEmail();

        if(loggedInUserEmail != null){
            rida.setEndTimestamp(LocalDateTime.now());
            rida.setLastUpdatedBy(loggedInUserEmail);
        }

        ridaRepository.save(rida);
    }

    public List<RidaResultDTO> getAllRidaByProject(Long projectId) {
        return ridaRepository.findAllByProjectId(projectId);
    }

    @Transactional
    public RidaAttachment addAttachment(Long ridaId, String fileName, String contentType, byte[] data) {
        RidaAttachment attachment = new RidaAttachment();
        attachment.setRidaId(ridaId);
        attachment.setFileName(fileName);
        attachment.setContentType(contentType);
        attachment.setData(data);

        return attachmentRepository.save(attachment);
    }

    @Transactional
    public void deleteAttachment(Long id) {
        attachmentRepository.deleteById(id);
    }

    public List<RidaAttachmentResultDTO> getAllAttachments(Long ridaId) {
        return attachmentRepository.findAllByRidaId(ridaId);
    }
}
