package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String paymentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Column(nullable = false)
    private Long tenantId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentType paymentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal paymentAmount;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal originalAmount;

    @Column(precision = 19, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(precision = 19, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(precision = 19, scale = 2)
    private BigDecimal remainingAmount;

    @Column(nullable = false)
    private String currency;

    @Column(length = 100)
    private String paymentMethod;

    @Column(length = 50)
    private String transactionReference;

    @Column(length = 50)
    private String chequeNumber;

    @Column(length = 100)
    private String bankName;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column
    private LocalDate paymentDate;

    @Column
    private LocalDate dueDate;

    @Column
    private LocalDate settlementDate;

    @Column
    private String settledBy;

    @Column(columnDefinition = "TEXT")
    private String settlementNotes;

    @Column
    private Boolean isPartialPayment = false;

    @Column
    private Boolean autoApplyToInvoice = true;

    @Column
    private Boolean isReversed = false;

    @Column
    private LocalDateTime reversedAt;

    @Column
    private String reversedBy;

    @Column(columnDefinition = "TEXT")
    private String reversalReason;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = true)
    @LastModifiedDate
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (paymentId == null) {
            paymentId = "PYNT-" + System.currentTimeMillis();
        }
        if (paymentDate == null) {
            paymentDate = LocalDate.now();
        }
        if (remainingAmount == null) {
            remainingAmount = paymentAmount;
        }
        if (originalAmount == null) {
            originalAmount = paymentAmount;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Business logic methods
    public boolean isFullySettled() {
        return remainingAmount.compareTo(BigDecimal.ZERO) == 0;
    }

    public boolean isPartiallySettled() {
        return remainingAmount.compareTo(BigDecimal.ZERO) > 0 && 
               remainingAmount.compareTo(paymentAmount) < 0;
    }

    public BigDecimal getSettledAmount() {
        return paymentAmount.subtract(remainingAmount);
    }

    public BigDecimal getOutstandingAmount() {
        return remainingAmount;
    }

    public void applySettlement(BigDecimal amount) {
        if (amount.compareTo(remainingAmount) > 0) {
            throw new IllegalArgumentException("Settlement amount cannot exceed remaining amount");
        }
        this.remainingAmount = this.remainingAmount.subtract(amount);
        if (this.remainingAmount.compareTo(BigDecimal.ZERO) == 0) {
            this.paymentStatus = PaymentStatus.COMPLETED;
            this.settlementDate = LocalDate.now();
        } else {
            this.paymentStatus = PaymentStatus.PARTIALLY_PAID;
        }
    }

    public void reversePayment(String reason, String reversedBy) {
        this.isReversed = true;
        this.reversedAt = LocalDateTime.now();
        this.reversedBy = reversedBy;
        this.reversalReason = reason;
        this.paymentStatus = PaymentStatus.REVERSED;
    }
}
