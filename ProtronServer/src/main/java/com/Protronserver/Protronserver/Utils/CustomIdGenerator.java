package com.Protronserver.Protronserver.Utils;

import org.springframework.stereotype.Component;

@Component
public class CustomIdGenerator {

    /**
     * Generates a formatted ID with a prefix and a zero-padded sequence number.
     * @param prefix The prefix for the ID (e.g., "US").
     * @param sequence The current count of items with that prefix.
     * @return A formatted string ID (e.g., "US-00001").
     */
    public String generate(String prefix, long sequence) {
        // This generates a 5-digit padded number. e.g., 1 -> 00001
        return prefix + "-" + String.format("%05d", sequence + 1);
    }
}
