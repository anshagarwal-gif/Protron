package com.Protronserver.Protronserver.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@RestController
@RequestMapping("/api/career")
public class CareerController {

    @Autowired
    private JavaMailSender mailSender;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<String> submitCareerApplication(
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam String contactNo,
            @RequestParam String qualification,
            @RequestParam(required = false) String message,
            @RequestParam String jobTitle,
            @RequestParam(required = false) MultipartFile resume) {
        try {
            // Email 1: Send form details from user to contact@deepspheretech.com
            MimeMessage adminMessage = mailSender.createMimeMessage();
            MimeMessageHelper adminHelper = new MimeMessageHelper(adminMessage, true, "UTF-8");

            adminHelper.setFrom(email);
            adminHelper.setTo("contact@deepspheretech.com");
            adminHelper.setSubject("Career Application: " + name + " - " + jobTitle);

            StringBuilder adminText = new StringBuilder();
            adminText.append("New Career Application\n\n");
            adminText.append("Name: ").append(name).append("\n");
            adminText.append("Email: ").append(email).append("\n");
            adminText.append("Contact No: ").append(contactNo).append("\n");
            adminText.append("Qualification: ").append(qualification).append("\n");
            adminText.append("Applying for: ").append(jobTitle).append("\n");
            if (message != null && !message.trim().isEmpty()) {
                adminText.append("\nMessage:\n").append(message);
            }

            adminHelper.setText(adminText.toString());

            if (resume != null && !resume.isEmpty()) {
                adminHelper.addAttachment(resume.getOriginalFilename(), resume);
            }

            // Email 2: Send confirmation email to user
            MimeMessage confirmationMessage = mailSender.createMimeMessage();
            MimeMessageHelper confirmationHelper = new MimeMessageHelper(confirmationMessage, true, "UTF-8");

            confirmationHelper.setFrom("contact@deepspheretech.com");
            confirmationHelper.setTo(email);
            confirmationHelper.setSubject("Thank you for your application - DST Global");

            StringBuilder confirmationText = new StringBuilder();
            confirmationText.append("Dear ").append(name).append(",\n\n");
            confirmationText.append(
                    "Thank you for your interest in joining DST Global. We have received your application for the position of ")
                    .append(jobTitle).append(".\n\n");
            confirmationText.append("Your application details:\n");
            confirmationText.append("Name: ").append(name).append("\n");
            confirmationText.append("Email: ").append(email).append("\n");
            confirmationText.append("Contact No: ").append(contactNo).append("\n");
            confirmationText.append("Qualification: ").append(qualification).append("\n");
            confirmationText.append("Position: ").append(jobTitle).append("\n");
            confirmationText.append("\nOur team will review your application and get back to you soon.\n\n");
            confirmationText.append("Best regards,\n");
            confirmationText.append("DST Global Team\n");
            confirmationText.append("contact@deepspheretech.com");

            confirmationHelper.setText(confirmationText.toString());

            mailSender.send(adminMessage);
            mailSender.send(confirmationMessage);

            return ResponseEntity.ok("Application submitted successfully!");
        } catch (MessagingException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to submit application.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to submit application.");
        }
    }
}
