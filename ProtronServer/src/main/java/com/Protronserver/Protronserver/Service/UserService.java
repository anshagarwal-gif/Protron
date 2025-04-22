package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.LoginRequest;
import com.Protronserver.Protronserver.DTOs.UserSignUpDTO;
import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.Repository.UserRepository;
import com.Protronserver.Protronserver.Utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private MailSender mailSender;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public User signupUser(UserSignUpDTO dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setFirstName(dto.getFirstName());
        user.setMiddleName(dto.getMiddleName());
        user.setLastName(dto.getLastName());
        user.setDisplayName(dto.getDisplayName());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setMobilePhone(dto.getMobilePhone());
        user.setLanPhone(dto.getLanPhone());
        user.setAddressLine1(dto.getAddressLine1());
        user.setAddressLine2(dto.getAddressLine2());
        user.setAddressLine3(dto.getAddressLine3());
        user.setCity(dto.getCity());
        user.setState(dto.getState());
        user.setZipCode(dto.getZipCode());
        user.setCountry(dto.getCountry());
        user.setDateOfJoining(new Date());
        user.setCost(dto.getCost());
        user.setUnit(dto.getUnit());
        if (dto.getProfilePhoto() != null && !dto.getProfilePhoto().isEmpty()) {
            try {
                user.setPhoto(dto.getProfilePhoto().getBytes());
            } catch (IOException e) {
                throw new IllegalArgumentException("Failed to process photo upload", e);
            }
        }
        // No role assigned for now
        user.setRole(null);

        User savedUser = userRepository.save(user);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("Welcome to Protron - Your Account Details");

        String content = """
                Hi %s,

                Welcome to Protron! Your account has been successfully created by the administrator.

                Here are your login credentials:
                Email: %s
                Password: %s

                For your security, we recommend changing your password after your first login.

                If you have any questions or face any issues logging in, feel free to contact our support team.

                We're excited to have you onboard!

                Regards,
                Team Protron
                """.formatted(
                user.getDisplayName() != null ? user.getDisplayName() : user.getFirstName(),
                user.getEmail(),
                dto.getPassword());

        message.setText(content);
        message.setFrom("dopahiya.feedback@gmail.com");
        mailSender.send(message);

        return savedUser;
    }

    public Map<String, String> loginUser(LoginRequest loginRequest) {
        Optional<User> userOptional = userRepository.findByEmailAndEndTimestampIsNull(loginRequest.getEmail());

        if (userOptional.isPresent()) {
            User user = userOptional.get();

            if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                String token = jwtUtil.generateToken(user.getEmail());
                Map<String, String> response = new HashMap<>();
                response.put("token", token);
                response.put("email", user.getEmail());
                response.put("empCode", user.getEmpCode());
                return response;
            } else {
                throw new RuntimeException("Invalid credentials");
            }
        } else {
            throw new RuntimeException("User not found with this email");
        }
    }
}
