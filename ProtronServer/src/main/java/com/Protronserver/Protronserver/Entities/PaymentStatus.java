package com.Protronserver.Protronserver.Entities;

public enum PaymentStatus {
    PENDING("Pending"),
    PROCESSING("Processing"),
    COMPLETED("Completed"),
    PARTIALLY_PAID("Partially Paid"),
    OVERDUE("Overdue"),
    CANCELLED("Cancelled"),
    REVERSED("Reversed"),
    FAILED("Failed"),
    REFUNDED("Refunded"),
    DISPUTED("Disputed"),
    ON_HOLD("On Hold");

    private final String displayName;

    PaymentStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
