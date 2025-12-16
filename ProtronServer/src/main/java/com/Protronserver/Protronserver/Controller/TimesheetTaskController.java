package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.AdminTimesheetSummaryDTO;
import com.Protronserver.Protronserver.DTOs.TimesheetTaskRequestDTO;
import com.Protronserver.Protronserver.Entities.TimesheetTask;
import com.Protronserver.Protronserver.Entities.TimesheetTaskAttachment;
import com.Protronserver.Protronserver.ResultDTOs.TimesheetTaskDTO;
import com.Protronserver.Protronserver.Service.TimesheetTaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

import java.util.Date;
import java.util.HashMap;
import java.util.List;

@RestController
@RequestMapping("/api/timesheet-tasks")
public class TimesheetTaskController {

    @Autowired
    private TimesheetTaskService timesheetTaskService;

    @PostMapping("/add")
    public ResponseEntity<TimesheetTask> addTimesheetTask(@RequestBody TimesheetTaskRequestDTO dto) {
        TimesheetTask savedTask = timesheetTaskService.addTask(dto, null);
        return ResponseEntity.ok(savedTask);
    }

    @GetMapping("/between")
    public ResponseEntity<List<TimesheetTaskDTO>> getTasksBetweenDates(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        List<TimesheetTaskDTO> tasks = timesheetTaskService.getTasksBetweenDates(start, end);

        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/admin-between")
    public ResponseEntity<List<TimesheetTaskDTO>> getTasksForUserBetweenDates(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam("userId") Long userId) {
        List<TimesheetTaskDTO> tasks = timesheetTaskService.getTasksBetweenDatesForUser(start, end, userId);
        return ResponseEntity.ok(tasks);
    }

    @PostMapping("/copy-last-week")
    public ResponseEntity<String> copyLastWeekTasks(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date end
            ) {
        timesheetTaskService.copyTasksToNextWeek(start, end);
        return ResponseEntity.ok("Tasks copied to next week successfully.");
    }

    @GetMapping("/total-hours")
    public ResponseEntity<Double> getTotalHours(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date end) {
        double totalHours = timesheetTaskService.calculateTotalHours(start, end);
        return ResponseEntity.ok(totalHours);
    }

    @PutMapping("/edit/{taskId}")
    public ResponseEntity<TimesheetTask> editTask(
            @PathVariable Long taskId,
            @RequestBody TimesheetTaskRequestDTO dto) {
        System.out.println(taskId);
        TimesheetTask updated = timesheetTaskService.updateTask(taskId, dto, null);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/delete/{taskId}")
    public ResponseEntity<String> deleteTask(@PathVariable Long taskId) {
        timesheetTaskService.deleteTask(taskId);
        return ResponseEntity.ok("Task deleted successfully.");
    }

    @PostMapping("/submit")
    public ResponseEntity<String> submitTimesheet(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date end) {
        String message = timesheetTaskService.submitPendingTasks(start, end);
        return ResponseEntity.ok(message);
    }

    @GetMapping("/admin/summary")
    public ResponseEntity<List<AdminTimesheetSummaryDTO>> getAdminTimesheetSummary(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date end) {
        List<AdminTimesheetSummaryDTO> summary = timesheetTaskService.getTimesheetSummaryForAllUsers(start, end);
        return ResponseEntity.ok(summary);
    }

    // ====== ATTACHMENT ENDPOINTS ======

    // NEW: Get all attachments for a task
    @GetMapping("/{taskId}/attachments")
    public ResponseEntity<List<Map<String, Object>>> getTaskAttachments(@PathVariable Long taskId) {
        try {
            System.out.println("Controller: Getting attachments for task " + taskId);

            TimesheetTask task = timesheetTaskService.findTaskById(taskId);
            if (task == null) {
                System.out.println("Controller: Task not found: " + taskId);
                return ResponseEntity.notFound().build();
            }

            List<TimesheetTaskAttachment> attachments = timesheetTaskService.getAttachmentsByTaskId(taskId);
            System.out.println("Controller: Found " + (attachments != null ? attachments.size() : 0) + " attachments");

            if (attachments == null || attachments.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }

            List<Map<String, Object>> attachmentList = attachments.stream()
                    .map(attachment -> {
                        Map<String, Object> attachmentInfo = new HashMap<>();
                        attachmentInfo.put("attachmentId", attachment.getAttachmentId());
                        attachmentInfo.put("fileName", attachment.getFileName());
                        attachmentInfo.put("fileType", attachment.getFileType());
                        attachmentInfo.put("fileSize", attachment.getFileSize());
                        return attachmentInfo;
                    })
                    .toList();

            return ResponseEntity.ok(attachmentList);

        } catch (Exception e) {
            System.err.println("Controller: Error in getTaskAttachments: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // NEW: Get specific attachment by ID
    @GetMapping("/attachments/{attachmentId}")
    public ResponseEntity<byte[]> getAttachment(@PathVariable Long attachmentId) {
        try {
            System.out.println("Controller: Getting attachment with ID: " + attachmentId);

            TimesheetTaskAttachment attachment = timesheetTaskService.getAttachmentById(attachmentId);

            if (attachment == null || attachment.getFileData() == null || attachment.getFileData().length == 0) {
                System.out.println("Controller: Attachment not found or empty: " + attachmentId);
                return ResponseEntity.notFound().build();
            }

            // Use the stored file type or detect it
            MediaType contentType = detectContentType(attachment.getFileData(), attachment.getFileType());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(contentType);
            headers.setContentLength(attachment.getFileData().length);

            String filename = attachment.getFileName() != null ? attachment.getFileName()
                    : "attachment_" + attachmentId;

            if (contentType.equals(MediaType.APPLICATION_PDF)) {
                headers.setContentDispositionFormData("inline", filename);
            } else {
                headers.setContentDispositionFormData("attachment", filename);
            }

            System.out.println("Controller: Successfully returning attachment: " + filename);
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(attachment.getFileData());

        } catch (RuntimeException e) {
            System.err.println("Controller: RuntimeException in getAttachment: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            System.err.println("Controller: Exception in getAttachment: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // DEBUG: Test endpoint to check if mapping works
    @GetMapping("/attachments/test")
    public ResponseEntity<String> testAttachmentMapping() {
        return ResponseEntity.ok("Attachment endpoint mapping is working!");
    }

    // DEBUG: Check specific attachment info
    @GetMapping("/debug/attachments/{attachmentId}")
    public ResponseEntity<String> debugAttachment(@PathVariable Long attachmentId) {
        try {
            System.out.println("DEBUG: Checking attachment ID: " + attachmentId);

            TimesheetTaskAttachment attachment = timesheetTaskService.getAttachmentById(attachmentId);

            if (attachment != null) {
                String info = String.format(
                        "Attachment found: ID=%d, fileName=%s, fileSize=%d, hasData=%b",
                        attachment.getAttachmentId(),
                        attachment.getFileName(),
                        attachment.getFileSize(),
                        attachment.getFileData() != null && attachment.getFileData().length > 0);
                return ResponseEntity.ok(info);
            } else {
                return ResponseEntity.ok("Attachment not found with ID: " + attachmentId);
            }

        } catch (Exception e) {
            return ResponseEntity.ok("ERROR: " + e.getMessage() + " - " + e.getClass().getSimpleName());
        }
    }

    // LEGACY: Keep old endpoint for backward compatibility
    @GetMapping("/{taskId}/attachment")
    public ResponseEntity<byte[]> getTaskAttachment(@PathVariable Long taskId) {
        try {
            List<TimesheetTaskAttachment> attachments = timesheetTaskService.getAttachmentsByTaskId(taskId);

            if (attachments == null || attachments.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            TimesheetTaskAttachment firstAttachment = attachments.get(0);
            byte[] attachmentData = firstAttachment.getFileData();

            if (attachmentData == null || attachmentData.length == 0) {
                return ResponseEntity.notFound().build();
            }

            MediaType contentType = detectContentType(attachmentData, firstAttachment.getFileType());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(contentType);
            headers.setContentLength(attachmentData.length);

            String filename = firstAttachment.getFileName() != null ? firstAttachment.getFileName()
                    : "document_" + taskId;

            if (contentType.equals(MediaType.APPLICATION_PDF)) {
                headers.setContentDispositionFormData("inline", filename);
            } else {
                headers.setContentDispositionFormData("attachment", filename);
            }

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(attachmentData);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // NEW: Delete specific attachment
    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<String> deleteAttachment(@PathVariable Long attachmentId) {
        try {
            timesheetTaskService.deleteAttachment(attachmentId);
            return ResponseEntity.ok("Attachment deleted successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete attachment.");
        }
    }

    // Helper methods for content type detection
    private MediaType detectContentType(byte[] data, String storedFileType) {
        if (data.length < 4) {
            return parseStoredFileType(storedFileType);
        }

        // Check PDF signature (%PDF)
        if (data[0] == 0x25 && data[1] == 0x50 && data[2] == 0x44 && data[3] == 0x46) {
            return MediaType.APPLICATION_PDF;
        }

        // Check JPEG signature
        if (data[0] == (byte) 0xFF && data[1] == (byte) 0xD8) {
            return MediaType.IMAGE_JPEG;
        }

        // Check PNG signature
        if (data[0] == (byte) 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47) {
            return MediaType.IMAGE_PNG;
        }

        // Check Excel signatures
        if (data.length >= 8) {
            if (data[0] == 0x50 && data[1] == 0x4B && data[2] == 0x03 && data[3] == 0x04) {
                return MediaType.valueOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            }

            if (data[0] == (byte) 0xD0 && data[1] == (byte) 0xCF && data[2] == 0x11 && data[3] == (byte) 0xE0) {
                return MediaType.valueOf("application/vnd.ms-excel");
            }
        }

        return parseStoredFileType(storedFileType);
    }

    private MediaType parseStoredFileType(String storedFileType) {
        if (storedFileType != null && !storedFileType.trim().isEmpty()) {
            try {
                return MediaType.parseMediaType(storedFileType);
            } catch (Exception e) {
                // If parsing fails, fall back to octet stream
            }
        }
        return MediaType.APPLICATION_OCTET_STREAM;
    }
}
