package com.Protronserver.Protronserver.DTO;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class InvoiceEmployeeDTO {

    private String itemDesc;   // can be employee name or role
    private BigDecimal rate;
    private Integer quantity;  // hours / units
    private BigDecimal amount;
    private String remarks;
}

