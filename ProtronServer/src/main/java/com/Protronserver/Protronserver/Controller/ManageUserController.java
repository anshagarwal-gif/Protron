package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.LoginRequest;
import com.Protronserver.Protronserver.DTOs.UserSignUpDTO;
import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.Repository.UserRepository;
import com.Protronserver.Protronserver.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class ManageUserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @PostMapping(value = "/signup", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> signupUser(@ModelAttribute UserSignUpDTO userSignUpDTO) {
        try {
            User createdUser = userService.signupUser(userSignUpDTO);
            return ResponseEntity.ok(createdUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest loginRequest) {
        try {
            Map<String, String> response = userService.loginUser(loginRequest);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @GetMapping
    private List<User> getAllUsers() {
        return userRepository.findByEndTimestampIsNull();
    }

    @GetMapping("/firstname/{firstName}")
    public List<User> getUsersByFirstName(@PathVariable String firstName) {
        return userRepository.findByFirstNameIgnoreCaseAndEndTimestampIsNull(firstName);
    }

    // Fetch user by email
    @GetMapping("/email/{email}")
    public Optional<User> getUserByEmail(@PathVariable String email) {
        return userRepository.findByEmailAndEndTimestampIsNull(email);
    }

    // Fetch user by empCode
    @GetMapping("/empcode/{empCode}")
    public Optional<User> getUserByEmpCode(@PathVariable String empCode) {
        return userRepository.findByEmpCodeAndEndTimestampIsNull(empCode);
    }

    // In your UserController.java
    @GetMapping("/{userId}/photo")
    public ResponseEntity<byte[]> getUserPhoto(@PathVariable Long userId) {
        try {
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

            if (user.getPhoto() == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG) // Adjust content type if needed
                    .body(user.getPhoto());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
