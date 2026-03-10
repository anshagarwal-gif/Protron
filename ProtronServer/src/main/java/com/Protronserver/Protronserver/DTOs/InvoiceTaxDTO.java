package com.Protronserver.Protronserver.DTOs;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceTaxDTO {

    @NotBlank(message = "Tax name is required")
    @Size(max = 100, message = "Tax name must not exceed 100 characters")
    private String taxName;

    @NotNull(message = "Tax percentage is required")
    @DecimalMin(value = "0.00", message = "Tax percentage must be 0 or greater")
    @DecimalMax(value = "100.00", message = "Tax percentage must not exceed 100")
    private BigDecimal taxPercentage;

    @Size(max = 50, message = "Tax number must not exceed 50 characters")
    private String taxNumber;
}
