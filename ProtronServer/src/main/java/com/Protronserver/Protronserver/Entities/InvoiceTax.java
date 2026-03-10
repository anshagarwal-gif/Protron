package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "invoice_taxes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceTax {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true)
    private String taxName;

    @Column(precision = 10, scale = 2, nullable = true)
    private BigDecimal taxPercentage;

    @Column(nullable = true)
    private String taxNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;
}
