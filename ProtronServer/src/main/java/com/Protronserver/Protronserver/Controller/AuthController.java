package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.Repository.UserRepository;
import com.Protronserver.Protronserver.Utils.OtpStore;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MailSender mailSender;

    @Autowired
    private OtpStore otpStore;

    // Keeps track of OTP verification status temporarily
    private final Set<String> verifiedEmails = new HashSet<>();

    BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        Optional<User> userOpt = userRepository.findByEmailAndEndTimestampIsNull(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Email not found");
        }

        String otp = String.valueOf(new Random().nextInt(900000) + 100000); // 6-digit OTP
        otpStore.storeOtp(email, otp);

        // Send Email
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Your OTP for password reset");
        String content = """
Hi,

We received a request to reset the password for your Protron account.

Please use the One-Time Password (OTP) below to proceed:

OTP: %s

This OTP is valid for 5 minutes. Do not share this with anyone.

If you did not request a password reset, you can safely ignore this email.

Regards,
Team Protron
""".formatted(otp);
        message.setText(content);
        message.setFrom("dopahiya.feedback@gmail.com");
        mailSender.send(message);

        return ResponseEntity.ok("OTP sent to your email");
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");

        if (!otpStore.validateOtp(email, otp)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired OTP");
        }

        // Mark this email as verified
        verifiedEmails.add(email);
        return ResponseEntity.ok("OTP verified successfully");
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String newPassword = request.get("newPassword");

        if (!verifiedEmails.contains(email)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("OTP not verified");
        }

        User user = userRepository.findByEmailAndEndTimestampIsNull(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Clear OTP and verification status
        otpStore.removeOtp(email);
        verifiedEmails.remove(email);

        return ResponseEntity.ok("Password successfully updated");
    }
}
