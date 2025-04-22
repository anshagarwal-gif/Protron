package com.Protronserver.Protronserver.Utils;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class OtpStore {
    private Map<String, OtpEntry> otpMap = new HashMap<>();

    public void storeOtp(String email, String otp) {
        otpMap.put(email, new OtpEntry(otp, System.currentTimeMillis() + 5 * 60 * 1000)); // 5 min expiry
    }

    public boolean validateOtp(String email, String otp) {
        OtpEntry entry = otpMap.get(email);
        if (entry == null) return false;
        if (System.currentTimeMillis() > entry.getExpiryTime()) return false;
        return entry.getOtp().equals(otp);
    }

    public void removeOtp(String email) {
        otpMap.remove(email);
    }

    private static class OtpEntry {
        private String otp;
        private long expiryTime;

        public OtpEntry(String otp, long expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
        }

        public String getOtp() {
            return otp;
        }

        public long getExpiryTime() {
            return expiryTime;
        }
    }
}
