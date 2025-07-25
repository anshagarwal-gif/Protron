package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.LoginRequest;
import com.Protronserver.Protronserver.DTOs.UserSignUpDTO;
import com.Protronserver.Protronserver.Entities.ProjectTeam;
import com.Protronserver.Protronserver.Entities.Role;
import com.Protronserver.Protronserver.Entities.Tenant;
import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.Repository.ProjectTeamRepository;
import com.Protronserver.Protronserver.Repository.RolesRepository;
import com.Protronserver.Protronserver.Repository.TenantRepository;
import com.Protronserver.Protronserver.Repository.UserRepository;
import com.Protronserver.Protronserver.Utils.JwtUtil;
import jakarta.persistence.EntityNotFoundException;

import org.hibernate.annotations.TenantId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;

@Service
public class UserService {
    @Autowired
    private LoginAuditService loginAuditService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private MailSender mailSender;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private ProjectTeamRepository projectTeamRepository;

    @Autowired
    private ManageTeamService manageTeamService;

    @Autowired
    private RolesRepository rolesRepository;

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
        user.setCost_time(dto.getCost_time());
        user.setUnit(dto.getUnit());
        Tenant tenant = tenantRepository.findById(dto.getTenant())
                .orElseThrow(() -> new EntityNotFoundException("Tenant Not found"));
        user.setTenant(tenant);
        if (dto.getProfilePhoto() != null && !dto.getProfilePhoto().isEmpty()) {
            try {
                user.setPhoto(dto.getProfilePhoto().getBytes());
            } catch (IOException e) {
                throw new IllegalArgumentException("Failed to process photo upload", e);
            }
        }

        Role role = rolesRepository.findById(dto.getRole())
                .orElseThrow(() -> new EntityNotFoundException("Role Not found"));
        user.setRole(role);
        user.setStatus("active");

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

    public Map<String, Object> loginUser(LoginRequest loginRequest) {
        Optional<User> userOptional = userRepository.findByEmailAndEndTimestampIsNull(loginRequest.getEmail());

        if (userOptional.isPresent()) {
            User user = userOptional.get();

            if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                String token = jwtUtil.generateToken(user.getEmail());
                loginAuditService.recordLogin(user, user.getTenant(), loginRequest.getTimezoneId());

                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                response.put("email", user.getEmail());
                response.put("empCode", user.getEmpCode());
                response.put("tenantId", user.getTenant().getTenantId());
                response.put("userId", user.getUserId());
                response.put("role", user.getRole().getRoleName());
                response.put("tenantName", user.getTenant().getTenantName());

                // Get access rights for this user's role
                List<Map<String, Object>> accessRightsList = user.getRole().getRoleAccessRights().stream()
                        .map(ar -> {
                            Map<String, Object> accessMap = new HashMap<>();
                            accessMap.put("moduleName", ar.getAccessRight().getModuleName());
                            accessMap.put("canView", ar.getAccessRight().isCanView());
                            accessMap.put("canEdit", ar.getAccessRight().isCanEdit());
                            accessMap.put("canDelete", ar.getAccessRight().isCanDelete());
                            return accessMap;
                        })
                        .toList();

                response.put("roleAccessRights", accessRightsList);

                List<Map<String, Object>> userAccessRightsList = user.getUserAccessRights().stream()
                        .map(ar -> {
                            Map<String, Object> accessMap = new HashMap<>();
                            accessMap.put("moduleName", ar.getAccessRight().getModuleName());
                            accessMap.put("canView", ar.getAccessRight().isCanView());
                            accessMap.put("canEdit", ar.getAccessRight().isCanEdit());
                            accessMap.put("canDelete", ar.getAccessRight().isCanDelete());
                            return accessMap;
                        }).toList();

                response.put("userAccessRights", userAccessRightsList);

                return response;
            } else {
                throw new RuntimeException("Invalid credentials");
            }
        } else {
            throw new RuntimeException("User not found with this email");
        }
    }

    public void logoutUser(User user) {
        loginAuditService.recordLogout(user);
    }

    public void holdUser(Long userId) {
        User existingUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("UserId: " + userId + " Not found"));

        existingUser.setStatus("hold");
        userRepository.save(existingUser);

        List<ProjectTeam> memberInTeams = projectTeamRepository.findByUser_UserIdAndEndTimestampIsNull(userId);
        for (ProjectTeam pt : memberInTeams) {
            ProjectTeam updatedMember = manageTeamService.updateStatus(pt.getProjectTeamId(), "hold");
            projectTeamRepository.save(updatedMember);
        }

    }

    public void activateUser(Long userId) {
        User existingUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("UserId: " + userId + " Not found"));

        existingUser.setStatus("active");
        userRepository.save(existingUser);

        List<ProjectTeam> memberInTeams = projectTeamRepository.findByUser_UserIdAndEndTimestampIsNull(userId);
        for (ProjectTeam pt : memberInTeams) {
            ProjectTeam updatedMember = manageTeamService.updateStatus(pt.getProjectTeamId(), "active");
            projectTeamRepository.save(updatedMember);
        }
    }

}
