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

        @Autowired
        private OAuth2LoginSuccessHandler oauth2LoginSuccessHandler;

        @Autowired
        private OAuth2LoginFailureHandler oauth2LoginFailureHandler;

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                logger.info("Configuring Security Filter Chain...");
                http
                                .cors(cors -> {})
                                .csrf(csrf -> csrf
                                                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                                                .ignoringRequestMatchers("/api/**", "/oauth2/**", "/login/oauth2/**")
                                )
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/api/users/login").permitAll()
                                                .requestMatchers("/api/users/signup").permitAll()
                                                .requestMatchers("/api/users/*/photo").permitAll()
                                                .requestMatchers("/api/auth/**").permitAll()
                                                .requestMatchers("/api/security/**").permitAll()
                                                .requestMatchers("/api/contact").permitAll()
                                                .requestMatchers("/api/career").permitAll()
                                                .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                                                .requestMatchers("/", "/login", "/login.html").permitAll()
                                                .anyRequest().authenticated()
                                )
                                .oauth2Login(oauth2 -> oauth2
                                                .successHandler(oauth2LoginSuccessHandler)
                                                .failureHandler(oauth2LoginFailureHandler)
                                );

                http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }
}