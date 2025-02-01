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
}
