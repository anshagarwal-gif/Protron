package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.ContactForm;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contact")

public class ContactController {

    @Autowired
    private JavaMailSender mailSender;

    @PostMapping
    public ResponseEntity<String> sendContactMessage(@RequestBody ContactForm form) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo("bhagirath961778@gmail.com"); // your support email
            message.setSubject("New Contact Message from " + form.getName());
            message.setText(
                    "Name: " + form.getName() + "\n" +
                            "Email: " + form.getEmail() + "\n\n" +
                            "Message:\n" + form.getMessage());

            mailSender.send(message);

            return ResponseEntity.ok("Message sent successfully!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to send message.");
        }
    }

}
