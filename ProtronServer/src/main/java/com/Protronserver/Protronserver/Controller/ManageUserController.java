package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.LoginRequest;
import com.Protronserver.Protronserver.DTOs.UserSignUpDTO;
import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.Repository.UserRepository;
import com.Protronserver.Protronserver.ResultDTOs.UserBasicDetailDTO;
import com.Protronserver.Protronserver.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
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
            Map<String, Object> response = userService.loginUser(loginRequest);
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

    @GetMapping("/basicdetails/{email}")
    public Optional<UserBasicDetailDTO> getUserBasicDetails(@PathVariable String email) {
        return userRepository.findBasicDetailsByEmail(email);
    }

    // Fetch user by empCode
    @GetMapping("/empcode/{empCode}")
    public Optional<User> getUserByEmpCode(@PathVariable String empCode) {
        return userRepository.findByEmpCodeAndEndTimestampIsNull(empCode);
    }

    @GetMapping("/loggedInUser")
    public Optional<User> getLoggedInUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (!(principal instanceof User user)) {
            throw new RuntimeException("Invalid user session");
        }
        return userRepository.findByEmailAndEndTimestampIsNull(user.getEmail());
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

    @PostMapping("/logout/{userId}")
    public ResponseEntity<?> logoutUser(@PathVariable Long userId, @RequestHeader("Authorization") String token) {
        try {
            Optional<User> optionalUser = userRepository.findById(userId);
            if (optionalUser.isPresent()) {
                User user = optionalUser.get();

                userService.logoutUser(user); // new method

                return ResponseEntity.ok("Logout successful");
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/status/hold/{userId}")
    public ResponseEntity<?> holdUser(@PathVariable Long userId){
        userService.holdUser(userId);
        return ResponseEntity.ok("Status Updated: User Hold");
    }

    @PutMapping("/status/activate/{userId}")
    public ResponseEntity<?> activateUser(@PathVariable Long userId){
        userService.activateUser(userId);
        return ResponseEntity.ok("Status Updated: User Activated");
    }

}
