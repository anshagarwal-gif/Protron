package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTO.BulkSignupResponse;
import com.Protronserver.Protronserver.DTO.UserSignupDto;
import com.Protronserver.Protronserver.DTOs.UserSignUpDTO;
import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/users")
public class UserBulkController {

    @Autowired
    private UserService userService;

    @PostMapping("/bulk-signup")
    public ResponseEntity<BulkSignupResponse> bulkSignup(@RequestBody List<UserSignupDto> users) {
        BulkSignupResponse resp = new BulkSignupResponse();
        resp.setTotal(users.size());

        // Use logged-in user's tenant when request does not send a valid tenant (avoids "Tenant Not found")
        Long fallbackTenantId = null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            User currentUser = (User) principal;
            if (currentUser.getTenant() != null) {
                fallbackTenantId = currentUser.getTenant().getTenantId();
            }
        }

        List<BulkSignupResponse.RowResult> rowResults = new ArrayList<>();

        int created = 0;
        int failed = 0;

        for (int i = 0; i < users.size(); i++) {
            UserSignupDto dto = users.get(i);
            List<String> errors = validate(dto);

            BulkSignupResponse.RowResult rowResult = new BulkSignupResponse.RowResult();
            rowResult.setIndex(i);

            if (!errors.isEmpty()) {
                failed++;
                rowResult.setSuccess(false);
                rowResult.setError(String.join(", ", errors));
                rowResults.add(rowResult);
                continue;
            }

            try {
                UserSignUpDTO single = mapToUserSignUpDTO(dto, fallbackTenantId);
                userService.signupUser(single);
                created++;
                rowResult.setSuccess(true);
                rowResult.setError(null);
            } catch (Exception ex) {
                failed++;
                rowResult.setSuccess(false);
                rowResult.setError(ex.getMessage() != null ? ex.getMessage() : "Failed to create user");
            }

            rowResults.add(rowResult);
        }

        resp.setCreated(created);
        resp.setFailed(failed);
        resp.setRows(rowResults);

        if (failed == 0) {
            resp.setMessage("All users created successfully.");
        } else if (created == 0) {
            resp.setMessage("No users created. All records invalid or failed.");
        } else {
            resp.setMessage("Some users created successfully. Check row errors for details.");
        }

        return ResponseEntity.ok(resp);
    }

    private UserSignUpDTO mapToUserSignUpDTO(UserSignupDto dto, Long fallbackTenantId) {
        UserSignUpDTO single = new UserSignUpDTO();

        single.setFirstName(dto.getFirstName());
        single.setMiddleName(dto.getMiddleName());
        single.setLastName(dto.getLastName());
        single.setDisplayName(dto.getDisplayName());
        single.setEmail(dto.getEmail());
        single.setPassword(dto.getPassword());

        String mobilePhone = "";
        if (dto.getMobileCountryCode() != null && dto.getMobileNumber() != null) {
            mobilePhone = dto.getMobileCountryCode() + dto.getMobileNumber();
        }
        String lanPhone = "";
        if (dto.getLandlineCountryCode() != null && dto.getLandlineNumber() != null) {
            lanPhone = dto.getLandlineCountryCode() + dto.getLandlineNumber();
        }
        single.setMobilePhone(mobilePhone);
        single.setLanPhone(lanPhone);

        single.setAddressLine1(dto.getAddressLine1());
        single.setAddressLine2(dto.getAddressLine2());
        single.setAddressLine3(dto.getAddressLine3());
        single.setCity(dto.getCity());
        single.setState(dto.getState());
        single.setZipCode(dto.getZipCode());
        single.setCountry(dto.getCountry());

        single.setCost(dto.getCost());
        single.setCost_time(dto.getCost_time());
        single.setUnit(dto.getUnit());

        boolean tenantSet = false;
        if (dto.getTenant() != null && !dto.getTenant().isBlank()) {
            try {
                single.setTenant(Long.parseLong(dto.getTenant()));
                tenantSet = true;
            } catch (NumberFormatException ignored) {
                // use fallback below
            }
        }
        if (!tenantSet && fallbackTenantId != null) {
            single.setTenant(fallbackTenantId);
        }

        single.setRoleId(dto.getRoleId());

        return single;
    }

    private List<String> validate(UserSignupDto dto) {
        List<String> errors = new ArrayList<>();

        if (isBlank(dto.getFirstName())) {
            errors.add("First name is required");
        }
        if (isBlank(dto.getLastName())) {
            errors.add("Last name is required");
        }
        if (dto.getRoleId() == null) {
            errors.add("Role ID is required");
        }

        if (isBlank(dto.getEmail())) {
            errors.add("Email is required");
        } else if (!isValidEmail(dto.getEmail())) {
            errors.add("Email must be valid and contain @");
        }

        if (isBlank(dto.getPassword())) {
            errors.add("Password is required");
        }
        if (isBlank(dto.getConfirmPassword())) {
            errors.add("Confirm password is required");
        } else if (!dto.getConfirmPassword().equals(dto.getPassword())) {
            errors.add("Passwords do not match");
        }

        return errors;
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private boolean isValidEmail(String email) {
        return Pattern.compile(".+@.+\\..+").matcher(email).matches();
    }
}
