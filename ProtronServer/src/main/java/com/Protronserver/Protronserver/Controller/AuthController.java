package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Value("${app.backend.url:https://deepspheretech.com}")
    private String backendUrl;

    @Autowired
    private UserService userService;

    @GetMapping("/oauth2/providers")
    public ResponseEntity<List<Map<String, String>>> getOAuth2Providers() {
        String base = backendUrl.endsWith("/") ? backendUrl : backendUrl + "/";
        List<Map<String, String>> providers = List.of(
                Map.of("id", "google", "name", "Google", "authorizationUrl", base + "oauth2/authorization/google"),
                Map.of("id", "azure", "name", "Microsoft (Outlook)", "authorizationUrl", base + "oauth2/authorization/azure")
        );
        return ResponseEntity.ok(providers);
    }

    @GetMapping("/session")
    public ResponseEntity<Map<String, Object>> getSession() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = null;
        if (principal instanceof User u) {
            user = u;
        } else if (principal instanceof String email && principal.toString().contains("@")) {
            user = userService.findByEmail(email).orElse(null);
        }
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(userService.buildSessionFromUser(user));
    }
}
