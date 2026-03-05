package com.Protronserver.Protronserver.DTO;

import java.util.ArrayList;
import java.util.List;

public class BulkSignupResponse {

    private int total;
    private int created;
    private int failed;
    private String message;

    private List<RowResult> rows = new ArrayList<>();

    public static class RowResult {
        private int index;
        private boolean success;
        private String error;

        public int getIndex() {
            return index;
        }

        public void setIndex(int index) {
            this.index = index;
        }

        public boolean isSuccess() {
            return success;
        }

        public void setSuccess(boolean success) {
            this.success = success;
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }
    }

    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    public int getCreated() {
        return created;
    }

    public void setCreated(int created) {
        this.created = created;
    }

    public int getFailed() {
        return failed;
    }

    public void setFailed(int failed) {
        this.failed = failed;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<RowResult> getRows() {
        return rows;
    }

    public void setRows(List<RowResult> rows) {
        this.rows = rows;
    }
}
