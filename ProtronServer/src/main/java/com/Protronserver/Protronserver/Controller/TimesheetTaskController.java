package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.AdminTimesheetSummaryDTO;
import com.Protronserver.Protronserver.DTOs.TimesheetTaskRequestDTO;
import com.Protronserver.Protronserver.Entities.TimesheetTask;
import com.Protronserver.Protronserver.Service.TimesheetTaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;


@RestController
@RequestMapping("/api/timesheet-tasks")
public class TimesheetTaskController {

    @Autowired
    private TimesheetTaskService timesheetTaskService;

    @PostMapping("/add")
    public ResponseEntity<TimesheetTask> addTimesheetTask(@RequestBody TimesheetTaskRequestDTO dto, @RequestParam(value = "userId", required = false) Long userId) {
        TimesheetTask savedTask = timesheetTaskService.addTask(dto, userId);
        return ResponseEntity.ok(savedTask);
    }

    @GetMapping("/between")
    public ResponseEntity<List<TimesheetTask>> getTasksBetweenDates(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date end) {
        List<TimesheetTask> tasks = timesheetTaskService.getTasksBetweenDates(start, end);

        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/admin-between")
    public ResponseEntity<List<TimesheetTask>> getTasksForUserBetweenDates(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date end,
            @RequestParam("userId") Long userId) {
        List<TimesheetTask> tasks = timesheetTaskService.getTasksBetweenDatesForUser(start, end, userId);
        return ResponseEntity.ok(tasks);
    }

    @PostMapping("/copy-last-week")
    public ResponseEntity<String> copyLastWeekTasks(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date end,
            @RequestParam(value = "userId", required = false) Long userId) {
        timesheetTaskService.copyTasksToNextWeek(start, end, userId);
        return ResponseEntity.ok("Tasks copied to next week successfully.");
    }

    @GetMapping("/total-hours")
    public ResponseEntity<Double> getTotalHours(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date end,
            @RequestParam(value = "userId", required = false) Long userId) {
        double totalHours = timesheetTaskService.calculateTotalHours(start, end, userId);
        return ResponseEntity.ok(totalHours);
    }

    @PutMapping("/edit/{taskId}")
    public ResponseEntity<TimesheetTask> editTask(
            @PathVariable Long taskId,
            @RequestBody TimesheetTaskRequestDTO dto) {
        System.out.println(taskId);
        TimesheetTask updated = timesheetTaskService.updateTask(taskId, dto);
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
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date end,
            @RequestParam(value = "userId", required = false) Long userId) {
        String message = timesheetTaskService.submitPendingTasks(start, end, userId);
        return ResponseEntity.ok(message);
    }

    @GetMapping("/admin/summary")
    public ResponseEntity<List<AdminTimesheetSummaryDTO>> getAdminTimesheetSummary(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date end) {
        List<AdminTimesheetSummaryDTO> summary = timesheetTaskService.getTimesheetSummaryForAllUsers(start, end);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/{taskId}/attachment")
    public ResponseEntity<byte[]> getTaskAttachment(@PathVariable Long taskId) {
        try {
            TimesheetTask task = timesheetTaskService.findTaskById(taskId);

            if (task == null) {
                return ResponseEntity.notFound().build();
            }

            byte[] attachment = task.getAttachment();

            if (attachment == null || attachment.length == 0) {
                return ResponseEntity.notFound().build();
            }

            // Detect content type based on file signature
            MediaType contentType = detectContentType(attachment);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(contentType);
            headers.setContentLength(attachment.length);

            // For PDFs, set inline disposition to view in browser
            if (contentType.equals(MediaType.APPLICATION_PDF)) {
                headers.setContentDispositionFormData("inline", "document_" + taskId + ".pdf");
            } else {
                headers.setContentDispositionFormData("attachment", "attachment_" + taskId);
            }

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(attachment);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Add this helper method to detect content type
    private MediaType detectContentType(byte[] data) {
        if (data.length < 4) {
            return MediaType.APPLICATION_OCTET_STREAM;
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

        // Default to octet stream
        return MediaType.APPLICATION_OCTET_STREAM;
    }
}
