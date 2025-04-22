package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.Date;

@Getter
@Setter
@Entity
@Table(name = "certificates")
public class Certificate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long certificateId;
    private String certificateName;
    private String issuedBy;
    private Date dateIssued;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
