package com.protron.Protron.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "approvers")
public class Approver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long approverId;

    @Column(nullable = false, unique = true)
    private String email;

    public Long getApproverId() {
        return approverId;
    }

    public void setApproverId(Long approverId) {
        this.approverId = approverId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
