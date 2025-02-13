package com.protron.Protron.controller;

import com.protron.Protron.entities.Approver;
import com.protron.Protron.entities.Employee;
import com.protron.Protron.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    AuthService authService;

    @PostMapping("/employeeLogin")
    public ResponseEntity<?> employeeLogin(@RequestBody Map<String, String> user){
        return authService.employeeLogin(user.get("email"), user.get("password"));
    }

    @PostMapping("/approverLogin")
    public ResponseEntity<?> approverLogin(@RequestBody Map<String, String> user){
        return authService.approverLogin(user.get("email"), user.get("password"));
    }

}
