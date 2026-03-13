package com.Protronserver.Protronserver.Entities;

public enum PaymentType {
    FULL_PAYMENT("Full Payment"),
    PARTIAL_PAYMENT("Partial Payment"),
    ADVANCE_PAYMENT("Advance Payment"),
    RETAINER("Retainer"),
    MILESTONE_PAYMENT("Milestone Payment"),
    DEPOSIT("Deposit"),
    REFUND("Refund"),
    ADJUSTMENT("Adjustment"),
    CREDIT_NOTE("Credit Note"),
    DEBIT_NOTE("Debit Note");

    private final String displayName;

    PaymentType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
