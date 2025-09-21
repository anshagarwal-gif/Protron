package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTO.StatusFlagDTO;
import com.Protronserver.Protronserver.Entities.StatusFlag;
import com.Protronserver.Protronserver.Service.StatusFlagService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/status-flags")

public class StatusFlagController {

    @Autowired
    private StatusFlagService statusFlagService;

    // Test endpoint to check if service is working

    // Get all status flags by status type
    @GetMapping("/type/{statusType}")
    public ResponseEntity<?> getStatusFlagsByType(@PathVariable String statusType) {
        try {
            System.out.println("Fetching status flags for type: " + statusType);
            List<StatusFlagDTO> statusFlags = statusFlagService.getStatusFlagsByType(statusType);
            System.out.println("Found " + statusFlags.size() + " status flags");
            return ResponseEntity.ok(statusFlags);
        } catch (Exception e) {
            System.err.println("Error fetching status flags: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    // Get all status flags
    @GetMapping
    public ResponseEntity<?> getAllStatusFlags() {
        try {
            System.out.println("Fetching all status flags");
            List<StatusFlag> statusFlags = statusFlagService.getAllStatusFlags();
            System.out.println("Found " + statusFlags.size() + " total status flags");
            return ResponseEntity.ok(statusFlags);
        } catch (Exception e) {
            System.err.println("Error fetching all status flags: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    // Get all distinct status types
    @GetMapping("/types")
    public ResponseEntity<?> getAllStatusTypes() {
        try {
            System.out.println("Fetching distinct status types");
            List<String> statusTypes = statusFlagService.getAllStatusTypes();
            System.out.println("Found " + statusTypes.size() + " status types: " + statusTypes);
            return ResponseEntity.ok(statusTypes);
        } catch (Exception e) {
            System.err.println("Error fetching status types: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
}