package com.Protronserver.Protronserver.DTOs;

import com.Protronserver.Protronserver.Entities.PaymentType;
import com.Protronserver.Protronserver.Entities.PaymentStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDTO {

    private Long id;

    private String paymentId;

    @NotNull(message = "Invoice ID is required")
    private String invoiceId;

    private Long invoiceDbId;

    @NotNull(message = "Payment type is required")
    private PaymentType paymentType;

    private PaymentStatus paymentStatus;

    @NotNull(message = "Payment amount is required")
    @DecimalMin(value = "0.01", message = "Payment amount must be greater than 0")
    @Digits(integer = 15, fraction = 2, message = "Payment amount must have maximum 15 integer digits and 2 decimal digits")
    private BigDecimal paymentAmount;

    private BigDecimal originalAmount;

    @Digits(integer = 15, fraction = 2, message = "Tax amount must have maximum 15 integer digits and 2 decimal digits")
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Digits(integer = 15, fraction = 2, message = "Discount amount must have maximum 15 integer digits and 2 decimal digits")
    private BigDecimal discountAmount = BigDecimal.ZERO;

    private BigDecimal remainingAmount;

    @NotBlank(message = "Currency is required")
    @Size(max = 3, message = "Currency code must be 3 characters")
    private String currency;

    @Size(max = 100, message = "Payment method must not exceed 100 characters")
    private String paymentMethod;

    @Size(max = 50, message = "Transaction reference must not exceed 50 characters")
    private String transactionReference;

    @Size(max = 50, message = "Cheque number must not exceed 50 characters")
    private String chequeNumber;

    @Size(max = 100, message = "Bank name must not exceed 100 characters")
    private String bankName;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;

    @NotNull(message = "Payment date is required")
    private LocalDate paymentDate;

    private LocalDate dueDate;

    private LocalDate settlementDate;

    private String settledBy;

    @Size(max = 1000, message = "Settlement notes must not exceed 1000 characters")
    private String settlementNotes;

    private Boolean isPartialPayment = false;

    private Boolean autoApplyToInvoice = true;

    private Boolean isReversed = false;

    private LocalDateTime reversedAt;

    private String reversedBy;

    @Size(max = 1000, message = "Reversal reason must not exceed 1000 characters")
    private String reversalReason;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Additional fields for API responses
    private String customerName;
    private String invoiceName;
    private BigDecimal invoiceTotalAmount;
    private BigDecimal totalPaidAmount;
    private BigDecimal outstandingAmount;
    private List<PaymentDTO> paymentHistory;
}
