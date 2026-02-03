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
            // Email 1: Send form details from user to contact@deepspheretech.com
            SimpleMailMessage adminMessage = new SimpleMailMessage();
            adminMessage.setFrom(form.getEmail());
            adminMessage.setTo("contact@deepspheretech.com");
            adminMessage.setSubject("New Contact Message from " + form.getName());
            adminMessage.setText(
                    "Name: " + form.getName() + "\n" +
                            (form.getCompanyName() != null && !form.getCompanyName().isEmpty()
                                    ? "Company: " + form.getCompanyName() + "\n"
                                    : "")
                            +
                            "Email: " + form.getEmail() + "\n" +
                            (form.getPhone() != null && !form.getPhone().isEmpty() ? "Phone: " + form.getPhone() + "\n"
                                    : "")
                            +
                            "\nMessage:\n" + form.getMessage());

            // Email 2: Send confirmation email to user
            SimpleMailMessage confirmationMessage = new SimpleMailMessage();
            confirmationMessage.setFrom("contact@deepspheretech.com");
            confirmationMessage.setTo(form.getEmail());
            confirmationMessage.setSubject("Thank you for contacting DST Global");
            confirmationMessage.setText(
                    "Dear " + form.getName() + ",\n\n" +
                            "Thank you for reaching out to DST Global. We have received your message and will get back to you soon.\n\n"
                            +
                            "Your message details:\n" +
                            (form.getCompanyName() != null && !form.getCompanyName().isEmpty()
                                    ? "Company: " + form.getCompanyName() + "\n"
                                    : "")
                            +
                            "Email: " + form.getEmail() + "\n" +
                            (form.getPhone() != null && !form.getPhone().isEmpty() ? "Phone: " + form.getPhone() + "\n"
                                    : "")
                            +
                            "\nBest regards,\n" +
                            "DST Global Team\n" +
                            "contact@deepspheretech.com");

            mailSender.send(adminMessage);
            mailSender.send(confirmationMessage);

            return ResponseEntity.ok("Message sent successfully!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to send message.");
        }
    }

}
