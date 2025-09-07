package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.Utils.JwtFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Configuration
public class SecurityConfig {

        @Autowired
        private JwtFilter jwtFilter;

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .cors().and() // Use WebConfig CORS configuration
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
                                                .anyRequest().authenticated() // Others need authentication
                                );

                http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }
}
