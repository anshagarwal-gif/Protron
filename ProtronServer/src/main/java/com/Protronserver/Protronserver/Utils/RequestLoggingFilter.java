package com.Protronserver.Protronserver.Utils;

import com.Protronserver.Protronserver.Entities.User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RequestLoggingFilter.class);
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

        String timestamp = LocalDateTime.now().format(formatter);
        String path = request.getRequestURI();
        String method = request.getMethod();
        String user = "Anonymous";
        String ipAddress = request.getRemoteAddr();

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal())) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof User) {
                user = ((User) principal).getEmail();
            } else {
                user = authentication.getName();
            }
        }

        try {
            filterChain.doFilter(wrappedRequest, wrappedResponse);
        } catch (Exception ex) {
            logger.error("[{}] User: {} | Action: {} | Endpoint: {} | IP: {} | ERROR: {}",
                    timestamp, user, method, path, ipAddress, ex.getMessage(), ex);
            throw ex;
        } finally {
            int status = wrappedResponse.getStatus();

            if (status >= 400) {
                String responseBody = new String(wrappedResponse.getContentAsByteArray(), StandardCharsets.UTF_8);
                String errorMessage = extractErrorMessage(responseBody);

                logger.warn("[{}] User: {} | Action: {} | Endpoint: {} | IP: {} | Status: {} | Error: {}",
                        timestamp, user, method, path, ipAddress, status, errorMessage);
            } else {
                logger.info("[{}] User: {} | Action: {} | Endpoint: {} | IP: {} | Status: {}",
                        timestamp, user, method, path, ipAddress, status);
            }

            wrappedResponse.copyBodyToResponse(); // send response to client
        }
    }

    private String extractErrorMessage(String responseBody) {
        if (responseBody == null || responseBody.isEmpty()) {
            return "No response body";
        }

        try {
            int index = responseBody.indexOf("\"message\"");
            if (index != -1) {
                int start = responseBody.indexOf(":", index) + 1;
                int end = responseBody.indexOf(",", start);
                if (end == -1)
                    end = responseBody.indexOf("}", start);
                String message = responseBody.substring(start, end).replaceAll("\"", "").trim();
                return message;
            }
        } catch (Exception ignored) {
        }

        return responseBody.length() > 200 ? responseBody.substring(0, 200) + "..." : responseBody;
    }
}
