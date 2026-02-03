package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.Utils.JwtFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Configuration
public class SecurityConfig {

        private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

        @Autowired
        private JwtFilter jwtFilter;

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                logger.info("Configuring Security Filter Chain...");
                http
                                .cors(cors -> cors.and()) // Use WebConfig CORS configuration
                                .csrf(csrf -> csrf
                                                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                                                .ignoringRequestMatchers("/api/**") // Disable CSRF for all API
                                                                                    // endpoints since we use JWT
                                )
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/api/users/login").permitAll() // Auth endpoints are
                                                                                                 // public
                                                .requestMatchers("/api/users/signup").permitAll()
                                                .requestMatchers("/api/users/*/photo").permitAll()
                                                .requestMatchers("/api/auth/**").permitAll() // Allow all auth endpoints
                                                .requestMatchers("/api/security/**").permitAll()
                                                .requestMatchers("/api/contact").permitAll() // Contact form (public)
                                                .requestMatchers("/api/career").permitAll() // Career form (public)
                                                .anyRequest().authenticated() // Others need authentication
                                );

                http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }
}
