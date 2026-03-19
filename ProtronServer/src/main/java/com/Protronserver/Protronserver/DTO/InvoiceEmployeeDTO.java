package com.Protronserver.Protronserver.DTO;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class InvoiceEmployeeDTO {

    private Long itemId;
    private String itemDesc;   // can be employee name or role
    private BigDecimal rate;
    private Integer quantity;  // hours / units
    private BigDecimal amount;
    private String remarks;
    private String updatedBy;
    private LocalDateTime updatedTs;
    private Long userId;
    private String empCode;
}

