package com.Protronserver.Protronserver.DTO;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class InvoiceItemDTO {

    private String itemDesc;
    private BigDecimal rate;
    private Integer quantity;
    private BigDecimal amount;
    private String remarks;
}

