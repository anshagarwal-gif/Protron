package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.LoginRequest;
import com.Protronserver.Protronserver.DTOs.UserSignUpDTO;
import com.Protronserver.Protronserver.DashboardRecords.UserCostCurrencyDTO;
import com.Protronserver.Protronserver.Entities.*;
import com.Protronserver.Protronserver.Repository.UserRepository;
import com.Protronserver.Protronserver.ResultDTOs.*;
import com.Protronserver.Protronserver.Service.UserService;
import com.Protronserver.Protronserver.Utils.UserProfileJson;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;

import java.util.*;

@RestController
@RequestMapping("/api/users")
public class ManageUserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

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
    public UserProfileDTO getUserByEmail(@PathVariable String email) throws Exception {
        UserProfileJson result = userRepository.findUserProfileById(email);

        if (result == null || result.getUserProfileJson() == null) {
            // Handle case where user is not found
            return null;
        }

        // Deserialize the JSON string from the DB into your DTO
        String json = result.getUserProfileJson();
        return objectMapper.readValue(json, UserProfileDTO.class);
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
    @Transactional  // Keep this to allow access to lazy fields
    public UserRoleAccessDTO getLoggedInUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (!(principal instanceof User user)) {
            throw new RuntimeException("Invalid user session");
        }

        // Map role → RoleDTO → RoleAccessRightDTO → AccessRightDTO
        Role role = user.getRole();
        RoleDTO roleDTO = null;

        if (role != null) {
            List<RoleAccessRightDTO> roleAccessRightDTOs = new ArrayList<>();
            for (RoleAccessRights rar : role.getRoleAccessRights()) {
                AccessRight ar = rar.getAccessRight();
                AccessRightDTO arDTO = new AccessRightDTO(
                        ar.getAccessId(),
                        ar.getModuleName(),
                        ar.isCanView(),
                        ar.isCanEdit(),
                        ar.isCanDelete()
                );
                roleAccessRightDTOs.add(new RoleAccessRightDTO(rar.getRoleAccessRightsId(), arDTO));
            }
            roleDTO = new RoleDTO(role.getRoleId(), role.getRoleName(), roleAccessRightDTOs);
        }

        // Map userAccessRight
        List<UserAccessRightDTO> userAccessRightDTOs = new ArrayList<>();
        for (UserAccessRights uar : user.getUserAccessRights()) {
            AccessRight ar = uar.getAccessRight();
            AccessRightDTO arDTO = new AccessRightDTO(
                    ar.getAccessId(),
                    ar.getModuleName(),
                    ar.isCanView(),
                    ar.isCanEdit(),
                    ar.isCanDelete()
            );
            userAccessRightDTOs.add(new UserAccessRightDTO(uar.getUserAccessRightsId(), arDTO));
        }

        return new UserRoleAccessDTO(user.getUserId(), roleDTO, userAccessRightDTOs);
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

    @GetMapping("/{userId}/editable-details")
    public ResponseEntity<UserEditableProfileDTO> getEditableDetails(@PathVariable Long userId) {
        Optional<UserEditableProfileDTO> dtoOptional = userRepository.findEditableProfileByUserId(userId);

        if (dtoOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        UserEditableProfileDTO dto = dtoOptional.get();

        // Fetch photo separately
        userRepository.findById(userId).ifPresent(user -> {
            dto.setPhoto(user.getPhoto()); // sets the byte[]
        });

        return ResponseEntity.ok(dto);
    }

    @PutMapping(value = "/{userId}/editable-details", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateEditableDetails(
            @PathVariable Long userId,
            @ModelAttribute UserEditableProfileDTO dto
    ) {
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        User user = optionalUser.get();

        user.setFirstName(dto.getFirstName());
        user.setMiddleName(dto.getMiddleName());
        user.setLastName(dto.getLastName());
        user.setMobilePhone(dto.getMobilePhone());
        user.setAddressLine1(dto.getAddressLine1());
        user.setAddressLine2(dto.getAddressLine2());
        user.setAddressLine3(dto.getAddressLine3());
        user.setCity(dto.getCity());
        user.setState(dto.getState());
        user.setZipCode(dto.getZipCode());
        user.setCountry(dto.getCountry());
        user.setCost(dto.getCost());
        user.setCost_time(dto.getCostTime());
        user.setUnit(dto.getUnit());

        // Set photo only if provided
        if (dto.getPhoto() != null && dto.getPhoto().length > 0) {
            user.setPhoto(dto.getPhoto());
        }

        userRepository.save(user);
        return ResponseEntity.ok("User details updated successfully");
    }

    @GetMapping("/{userId}/cost-currency")
    public ResponseEntity<UserCostCurrencyDTO> getUserCostAndCurrency(@PathVariable Long userId) {
        UserCostCurrencyDTO dto = userService.getUserCostCurrencyNative(userId);
        return ResponseEntity.ok(dto);
    }



}
