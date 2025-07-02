package com.Protronserver.Protronserver.Controller;

import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.*;

@RestController
@RequestMapping("/audit")
public class AuditLogController {

    @GetMapping("/user/{email}")
    public ResponseEntity<Resource> downloadAuditTrailForUser(@PathVariable String email) throws IOException {
        File logDir = new File("logs");
        if (!logDir.exists() || !logDir.isDirectory()) {
            return ResponseEntity.notFound().build();
        }

        // Match current + rolled files
        File[] logFiles = logDir.listFiles((dir, name) -> name.startsWith("request-logs"));

        if (logFiles == null || logFiles.length == 0) {
            return ResponseEntity.notFound().build();
        }

        File tempFile = File.createTempFile("audit-" + email.replaceAll("@", "_"), ".log");

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(tempFile))) {
            for (File logFile : logFiles) {
                try (BufferedReader reader = new BufferedReader(new FileReader(logFile))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        if (line.contains("User: " + email)) {
                            writer.write(line);
                            writer.newLine();
                        }
                    }
                }
            }
        }

        InputStreamResource resource = new InputStreamResource(new FileInputStream(tempFile));
        tempFile.deleteOnExit();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=audit-trail-" + email + ".log")
                .contentType(MediaType.TEXT_PLAIN)
                .contentLength(tempFile.length())
                .body(resource);
    }
}

