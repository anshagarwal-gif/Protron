package com.Protronserver.Protronserver.ResultDTOs;

import java.math.BigDecimal;

public record EligibleMilestone(
    Long msId,
    String msName,
    BigDecimal remainingBalance
){}
