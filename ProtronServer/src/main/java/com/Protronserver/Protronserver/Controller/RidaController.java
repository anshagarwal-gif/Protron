package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.RidaEditRequestDTO;
import com.Protronserver.Protronserver.DTOs.RidaRequestDTO;
import com.Protronserver.Protronserver.Entities.Rida;
import com.Protronserver.Protronserver.Entities.RidaAttachment;
import com.Protronserver.Protronserver.ResultDTOs.RidaAttachmentResultDTO;
import com.Protronserver.Protronserver.ResultDTOs.RidaResultDTO;
import com.Protronserver.Protronserver.Service.RidaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/rida")
public class RidaController {

    private final RidaService ridaService;

    public RidaController(RidaService ridaService) {
        this.ridaService = ridaService;
    }

    // ✅ Add RIDA
    @PostMapping("/project/{projectId}")
    public ResponseEntity<RidaResultDTO> addRida(
            @PathVariable Long projectId,
            @RequestBody RidaRequestDTO dto
    ) {
        RidaResultDTO saved = ridaService.addRida(dto, projectId);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    // ✅ Edit RIDA
    @PutMapping("/{ridaId}")
    public ResponseEntity<RidaResultDTO> editRida(
            @PathVariable Long ridaId,
            @RequestBody RidaEditRequestDTO dto
    ) {
        RidaResultDTO updated = ridaService.editRida(dto, ridaId);
        return ResponseEntity.ok(updated);
    }

    // ✅ Delete RIDA
    @DeleteMapping("/{ridaId}")
    public ResponseEntity<Void> deleteRida(@PathVariable Long ridaId) {
        ridaService.deleteRida(ridaId);
        return ResponseEntity.noContent().build();
    }

    // ✅ Get all RIDA by Project
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<RidaResultDTO>> getAllRidaByProject(@PathVariable Long projectId) {
        List<RidaResultDTO> ridas = ridaService.getAllRidaByProject(projectId);
        return ResponseEntity.ok(ridas);
    }

    // ✅ Add Attachment
    @PostMapping("/{ridaId}/attachments")
    public ResponseEntity<RidaAttachment> addAttachment(
            @PathVariable Long ridaId,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        RidaAttachment attachment = ridaService.addAttachment(
                ridaId,
                file.getOriginalFilename(),
                file.getContentType(),
                file.getBytes()
        );
        return new ResponseEntity<>(attachment, HttpStatus.CREATED);
    }

    // ✅ Delete Attachment
    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long attachmentId) {
        ridaService.deleteAttachment(attachmentId);
        return ResponseEntity.noContent().build();
    }

    // ✅ Get All Attachments of RIDA
    @GetMapping("/{ridaId}/attachments")
    public ResponseEntity<List<RidaAttachmentResultDTO>> getAllAttachments(@PathVariable Long ridaId) {
        List<RidaAttachmentResultDTO> attachments = ridaService.getAllAttachments(ridaId);
        return ResponseEntity.ok(attachments);
    }

    // ✅ Bulk update project for Rida attachments
    @PutMapping("/attachments/update-project/{projectId}")
    public ResponseEntity<Void> updateProjectForAttachments(
            @PathVariable Long projectId,
            @RequestBody List<Long> attachmentIds
    ) {
        ridaService.updateProjectForAttachments(attachmentIds, projectId);
        return ResponseEntity.ok().build();
    }
}
