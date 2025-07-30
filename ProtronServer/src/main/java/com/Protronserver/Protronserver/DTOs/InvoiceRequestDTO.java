package com.Protronserver.Protronserver.DTOs;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceRequestDTO {

    @NotBlank(message = "Invoice name is required")
    @Size(max = 100, message = "Invoice name must not exceed 100 characters")
    private String invoiceName;

    @NotBlank(message = "Customer name is required")
    @Size(max = 100, message = "Customer name must not exceed 100 characters")
    private String customerName;

    private String customerAddress;

    @NotBlank(message = "Supplier name is required")
    @Size(max = 100, message = "Supplier name must not exceed 100 characters")
    private String supplierName;

    private String supplierAddress;

    @NotBlank(message = "Employee name is required")
    @Size(max = 100, message = "Employee name must not exceed 100 characters")
    private String employeeName;

    @NotNull(message = "Rate is required")
    @DecimalMin(value = "0.01", message = "Rate must be greater than 0")
    private BigDecimal rate;

    @NotBlank(message = "Currency is required")
    @Size(min = 3, max = 3, message = "Currency must be 3 characters")
    private String currency;

    @NotNull(message = "From date is required")
    private LocalDate fromDate;

    @NotNull(message = "To date is required")
    private LocalDate toDate;

    @NotNull(message = "Hours spent is required")
    @Min(value = 1, message = "Hours spent must be at least 1")
    private Integer hoursSpent;

    private BigDecimal totalAmount; // Optional, will be calculated if not provided

    @Size(max = 1000, message = "Remarks must not exceed 1000 characters")
    private String remarks;
}
