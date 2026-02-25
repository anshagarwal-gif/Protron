package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.Service.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2LoginSuccessHandler.class);

    @Value("${app.frontend.url:https://www.deepspheretech.com}")
    private String frontendUrl;

    private final UserService userService;

    public OAuth2LoginSuccessHandler(UserService userService) {
        this.userService = userService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                         Authentication authentication) throws IOException, ServletException {
        if (!(authentication.getPrincipal() instanceof OAuth2User oauth2User)) {
            redirectToLoginWithError(request, response, "invalid_oauth_user");
            return;
        }
        String email = extractEmail(oauth2User);
        if (email == null || email.isBlank()) {
            logger.warn("OAuth2 user has no email: {}", oauth2User.getAttributes().keySet());
            redirectToLoginWithError(request, response, "email_not_available");
            return;
        }
        try {
            Map<String, Object> loginResponse = userService.processOAuth2Login(email, null);
            String token = (String) loginResponse.get("token");
            String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl)
                    .path("/auth/callback")
                    .queryParam("token", token)
                    .build().toUriString();
            getRedirectStrategy().sendRedirect(request, response, targetUrl);
        } catch (RuntimeException e) {
            String errorCode = "USER_NOT_REGISTERED".equals(e.getMessage()) ? "user_not_registered"
                    : "USER_NOT_ACTIVE".equals(e.getMessage()) ? "user_not_active" : "oauth_failed";
            logger.info("OAuth2 login rejected for {}: {}", email, e.getMessage());
            redirectToLoginWithError(request, response, errorCode);
        }
    }

    private String extractEmail(OAuth2User oauth2User) {
        Map<String, Object> attrs = oauth2User.getAttributes();
        if (attrs.get("email") instanceof String e) return e;
        if (attrs.get("preferred_username") instanceof String u) return u;
        if (attrs.get("mail") instanceof String m) return m;
        return null;
    }

    private void redirectToLoginWithError(HttpServletRequest request, HttpServletResponse response, String errorCode) throws IOException {
        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl)
                .path("/login").queryParam("error", errorCode).build().toUriString();
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
