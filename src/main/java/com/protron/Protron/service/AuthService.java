package com.protron.Protron.service;

import com.protron.Protron.entities.Approver;
import com.protron.Protron.entities.Employee;
import com.protron.Protron.repository.ApproverRepository;
import com.protron.Protron.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    EmployeeRepository employeeRepository;

    @Autowired
    ApproverRepository approverRepository;

    public ResponseEntity<?> employeeLogin(String email, String password){
        System.out.println(email);
        System.out.println(password);

        Employee employee = employeeRepository.findByEmail(email);
        if(employee == null){
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Employee Not Found");
        }

        if(!employee.getPassword().equals(password)){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Incorrect Password");
        }

        return new ResponseEntity<>(employee, HttpStatus.OK);
    }

    public ResponseEntity<?> approverLogin(String email, String password){
        Approver approver = approverRepository.findByEmail(email);
        if(approver == null){
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Approver Not Found");
        }

        if(!approver.getPassword().equals(password)){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Password");
        }

        return new ResponseEntity<>(approver, HttpStatus.OK);
    }

}
