package com.Protronserver.Protronserver.Utils;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import java.util.Map;
import java.util.HashMap;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception ex, HttpServletRequest request) {

        String timestamp = LocalDateTime.now().format(formatter);
        String path = request.getRequestURI();
        String method = request.getMethod();
        String user = "Anonymous";

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            user = auth.getName();
        }
        logger.error("[{}] HANDLED ERROR during {} {} by {} - {}", timestamp, method, path, user, ex.getMessage(), ex);

        Map<String, Object> errorBody = new HashMap<>();
        errorBody.put("timestamp", timestamp);
        errorBody.put("path", path);
        errorBody.put("method", method);
        errorBody.put("user", user);
        errorBody.put("message", ex.getMessage());
        errorBody.put("status", 500);

        return ResponseEntity.status(500).body(errorBody);
    }
}
