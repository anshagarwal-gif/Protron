package com.Protronserver.Protronserver.DTOs;

import com.Protronserver.Protronserver.Entities.PaymentType;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentSettlementRequest {

    @NotNull(message = "Invoice ID is required")
    private String invoiceId;

    @NotNull(message = "Settlement type is required")
    private SettlementType settlementType;

    @NotNull(message = "Payment amount is required")
    @DecimalMin(value = "0.01", message = "Payment amount must be greater than 0")
    @Digits(integer = 8, fraction = 2, message = "Payment amount must have maximum 8 integer digits and 2 decimal digits")
    private BigDecimal settlementAmount;

    @NotNull(message = "Currency is required")
    private String currency;

    @NotNull(message = "Payment date is required")
    private LocalDate paymentDate;

    @NotBlank(message = "Payment method is required")
    @Size(max = 100, message = "Payment method must not exceed 100 characters")
    private String paymentMethod;

    @Size(max = 250, message = "Transaction reference must not exceed 250 characters")
    private String transactionReference;

    @Size(max = 50, message = "Cheque number must not exceed 50 characters")
    private String chequeNumber;

    @Size(max = 100, message = "Bank name must not exceed 100 characters")
    private String bankName;

    @Size(max = 500, message = "Settlement notes must not exceed 500 characters")
    private String settlementNotes;

    private String settledBy;

    private Boolean autoApplyToInvoice = true;

    // For multiple payment settlements
    private List<PaymentDetail> paymentDetails;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentDetail {
        @NotNull(message = "Payment amount is required")
        @DecimalMin(value = "0.01", message = "Payment amount must be greater than 0")
        @Digits(integer = 8, fraction = 2, message = "Payment amount must have maximum 8 integer digits and 2 decimal digits")
        private BigDecimal amount;

        @NotNull(message = "Currency is required")
        private String currency;

        @NotBlank(message = "Payment method is required")
        private String paymentMethod;

        @NotNull(message = "Payment date is required")
        private LocalDate paymentDate;

        @Size(max = 250, message = "Transaction reference must not exceed 250 characters")
        private String transactionReference;

        @Size(max = 50, message = "Cheque number must not exceed 50 characters")
        private String chequeNumber;

        @Size(max = 100, message = "Bank name must not exceed 100 characters")
        private String bankName;

        @Size(max = 500, message = "Settlement notes must not exceed 500 characters")
        private String settlementNotes;

        private String notes;
    }

    public enum SettlementType {
        FULL_PAYMENT("Full Payment"),
        PARTIAL_PAYMENT("Partial Payment"),
        MULTIPLE_PAYMENTS("Multiple Payments");

        private final String displayName;

        SettlementType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}
