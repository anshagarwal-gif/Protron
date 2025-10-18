package com.Protronserver.Protronserver.Controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.web.bind.annotation.*;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;
import java.io.File;

@RestController
@RequestMapping("/api/security")
public class RSAController {

    @GetMapping("/public-key")
    public String getPublicKey() throws Exception {
        try {
            // Try classpath first
            InputStream is = new ClassPathResource("keys/public.pem").getInputStream();
            byte[] keyBytes = is.readAllBytes();
            return Base64.getEncoder().encodeToString(keyBytes);
        } catch (Exception e) {
            // Fallback to filesystem
            File file = new File("keys/public.pem");
            if (file.exists()) {
                byte[] keyBytes = Files.readAllBytes(Paths.get("keys/public.pem"));
                return Base64.getEncoder().encodeToString(keyBytes);
            }
            throw new RuntimeException("Public key not found!");
        }
    }
}
