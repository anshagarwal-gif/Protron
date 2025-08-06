package com.Protronserver.Protronserver.DashboardRecords;

import java.math.BigDecimal;

public record PoVsInvoiceDTO(String projectName, BigDecimal poAmount, BigDecimal invoiceAmount) {}