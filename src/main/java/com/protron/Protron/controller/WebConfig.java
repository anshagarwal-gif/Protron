package com.protron.Protron.controller;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Apply to all endpoints
                .allowedOrigins("http://localhost:3000") // Allow frontend
                .allowedMethods("GET", "POST", "PUT", "DELETE") // Allow specific methods
                .allowedHeaders("*") // Allow all headers
                .allowCredentials(true); // Allow cookies
    }
}
