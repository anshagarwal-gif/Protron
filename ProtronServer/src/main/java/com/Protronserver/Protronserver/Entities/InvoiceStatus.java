package com.Protronserver.Protronserver.Entities;

public enum InvoiceStatus {
    DRAFT("Draft"),
    SAVED("Saved");

    private final String displayName;

    InvoiceStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
