package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.Entities.Template;
import com.Protronserver.Protronserver.Repository.TemplateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/templates")
public class TemplateController {

    private static final String USER_BULK_TEMPLATE_NAME = "USER_BULK_UPLOAD";

    @Autowired
    private TemplateRepository templateRepository;

    public static class TemplateMetaDTO {
        private Long templateId;
        private String templateName;
        private String templateFileName;
        private LocalDateTime lastUpdated;
        private String updatedBy;

        public Long getTemplateId() {
            return templateId;
        }

        public void setTemplateId(Long templateId) {
            this.templateId = templateId;
        }

        public String getTemplateName() {
            return templateName;
        }

        public void setTemplateName(String templateName) {
            this.templateName = templateName;
        }

        public String getTemplateFileName() {
            return templateFileName;
        }

        public void setTemplateFileName(String templateFileName) {
            this.templateFileName = templateFileName;
        }

        public LocalDateTime getLastUpdated() {
            return lastUpdated;
        }

        public void setLastUpdated(LocalDateTime lastUpdated) {
            this.lastUpdated = lastUpdated;
        }

        public String getUpdatedBy() {
            return updatedBy;
        }

        public void setUpdatedBy(String updatedBy) {
            this.updatedBy = updatedBy;
        }
    }

    @GetMapping("/user-bulk/meta")
    public ResponseEntity<TemplateMetaDTO> getUserBulkTemplateMeta() {
        Optional<Template> optional = templateRepository.findByTemplateName(USER_BULK_TEMPLATE_NAME);
        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Template template = optional.get();
        TemplateMetaDTO dto = new TemplateMetaDTO();
        dto.setTemplateId(template.getTemplateId());
        dto.setTemplateName(template.getTemplateName());
        dto.setTemplateFileName(template.getTemplateFileName());
        dto.setLastUpdated(template.getLastUpdated());
        dto.setUpdatedBy(template.getUpdatedBy());

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/user-bulk/download")
    public ResponseEntity<byte[]> downloadUserBulkTemplate() {
        Optional<Template> optional = templateRepository.findByTemplateName(USER_BULK_TEMPLATE_NAME);
        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Template template = optional.get();

        String encodedFileName = URLEncoder.encode(template.getTemplateFileName(), StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFileName + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(template.getTemplateFile());
    }

    @PostMapping(value = "/user-bulk", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TemplateMetaDTO> uploadOrUpdateUserBulkTemplate(
            @RequestParam("file") MultipartFile file,
            @RequestParam("updatedBy") String updatedBy
    ) throws Exception {

        Template template = templateRepository.findByTemplateName(USER_BULK_TEMPLATE_NAME)
                .orElseGet(Template::new);

        template.setTemplateName(USER_BULK_TEMPLATE_NAME);
        template.setTemplateFileName(file.getOriginalFilename());
        template.setTemplateFile(file.getBytes());
        template.setLastUpdated(LocalDateTime.now());
        template.setUpdatedBy(updatedBy);

        Template saved = templateRepository.save(template);

        TemplateMetaDTO dto = new TemplateMetaDTO();
        dto.setTemplateId(saved.getTemplateId());
        dto.setTemplateName(saved.getTemplateName());
        dto.setTemplateFileName(saved.getTemplateFileName());
        dto.setLastUpdated(saved.getLastUpdated());
        dto.setUpdatedBy(saved.getUpdatedBy());

        return ResponseEntity.ok(dto);
    }
}

