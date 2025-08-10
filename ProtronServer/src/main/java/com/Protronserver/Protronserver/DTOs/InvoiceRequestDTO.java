package com.Protronserver.Protronserver.DTOs;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceRequestDTO {

    @NotBlank(message = "Invoice name is required")
    @Size(max = 100, message = "Invoice name must not exceed 100 characters")
    private String invoiceName;

    @NotBlank(message = "Customer name is required")
    @Size(max = 100, message = "Customer name must not exceed 100 characters")
    private String customerName;

    private String customerAddress;

    @NotBlank(message = "Supplier name is required")
    @Size(max = 100, message = "Supplier name must not exceed 100 characters")
    private String supplierName;

    private String supplierAddress;

    @NotBlank(message = "Employee name is required")
    @Size(max = 100, message = "Employee name must not exceed 100 characters")
    private String employeeName;

    @NotNull(message = "Rate is required")
    @DecimalMin(value = "0.01", message = "Rate must be greater than 0")
    private BigDecimal rate;

    @NotBlank(message = "Currency is required")
    @Size(min = 3, max = 3, message = "Currency must be 3 characters")
    private String currency;

    @NotNull(message = "From date is required")
    private LocalDate fromDate;

    @NotNull(message = "To date is required")
    private LocalDate toDate;

    @NotNull(message = "Hours spent is required")
    @Min(value = 1, message = "Hours spent must be at least 1")
    private Double hoursSpent;

    private BigDecimal totalAmount; // Optional, will be calculated if not provided

    @Size(max = 1000, message = "Remarks must not exceed 1000 characters")
    private String remarks;
    private TimesheetDataDTO timesheetData;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimesheetDataDTO {
        private String viewMode; // "Weekly" or "Monthly"
        private String period; // Date range string
        private String employeeName;
        private String employeeEmail;
        private Integer totalHours;
        private Integer totalMinutes;
        private Integer targetHours;
        private java.util.List<TimesheetEntryDTO> entries;

        public String getViewMode() {
            return viewMode;
        }

        public void setViewMode(String viewMode) {
            this.viewMode = viewMode;
        }

        public String getPeriod() {
            return period;
        }

        public void setPeriod(String period) {
            this.period = period;
        }

        public String getEmployeeName() {
            return employeeName;
        }

        public void setEmployeeName(String employeeName) {
            this.employeeName = employeeName;
        }

        public String getEmployeeEmail() {
            return employeeEmail;
        }

        public void setEmployeeEmail(String employeeEmail) {
            this.employeeEmail = employeeEmail;
        }

        public Integer getTotalHours() {
            return totalHours;
        }

        public void setTotalHours(Integer totalHours) {
            this.totalHours = totalHours;
        }

        public Integer getTotalMinutes() {
            return totalMinutes;
        }

        public void setTotalMinutes(Integer totalMinutes) {
            this.totalMinutes = totalMinutes;
        }

        public Integer getTargetHours() {
            return targetHours;
        }

        public void setTargetHours(Integer targetHours) {
            this.targetHours = targetHours;
        }

        public java.util.List<TimesheetEntryDTO> getEntries() {
            return entries;
        }

        public void setEntries(java.util.List<TimesheetEntryDTO> entries) {
            this.entries = entries;
        }


    }

    // Nested DTO for individual timesheet entries
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimesheetEntryDTO {
        private String date;
        private String dayOfWeek;
        private Boolean isWeekend;
        private String taskType;
        private String taskTopic;
        private Integer hours;
        private Integer minutes;
        private String description;
        private String project;
        private Boolean submitted;

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public String getDayOfWeek() {
            return dayOfWeek;
        }

        public void setDayOfWeek(String dayOfWeek) {
            this.dayOfWeek = dayOfWeek;
        }

        public Boolean getIsWeekend() {
            return isWeekend;
        }

        public void setIsWeekend(Boolean isWeekend) {
            this.isWeekend = isWeekend;
        }

        public String getTaskType() {
            return taskType;
        }

        public void setTaskType(String taskType) {
            this.taskType = taskType;
        }

        public String getTaskTopic() {
            return taskTopic;
        }

        public void setTaskTopic(String taskTopic) {
            this.taskTopic = taskTopic;
        }

        public Integer getHours() {
            return hours;
        }

        public void setHours(Integer hours) {
            this.hours = hours;
        }

        public Integer getMinutes() {
            return minutes;
        }

        public void setMinutes(Integer minutes) {
            this.minutes = minutes;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getProject() {
            return project;
        }

        public void setProject(String project) {
            this.project = project;
        }

        public Boolean getSubmitted() {
            return submitted;
        }

        public void setSubmitted(Boolean submitted) {
            this.submitted = submitted;
        }


    }

    public @NotBlank(message = "Invoice name is required") @Size(max = 100, message = "Invoice name must not exceed 100 characters") String getInvoiceName() {
        return invoiceName;
    }

    public void setInvoiceName(
            @NotBlank(message = "Invoice name is required") @Size(max = 100, message = "Invoice name must not exceed 100 characters") String invoiceName) {
        this.invoiceName = invoiceName;
    }

    public @NotBlank(message = "Customer name is required") @Size(max = 100, message = "Customer name must not exceed 100 characters") String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(
            @NotBlank(message = "Customer name is required") @Size(max = 100, message = "Customer name must not exceed 100 characters") String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerAddress() {
        return customerAddress;
    }

    public void setCustomerAddress(String customerAddress) {
        this.customerAddress = customerAddress;
    }

    public @NotBlank(message = "Supplier name is required") @Size(max = 100, message = "Supplier name must not exceed 100 characters") String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(
            @NotBlank(message = "Supplier name is required") @Size(max = 100, message = "Supplier name must not exceed 100 characters") String supplierName) {
        this.supplierName = supplierName;
    }

    public String getSupplierAddress() {
        return supplierAddress;
    }

    public void setSupplierAddress(String supplierAddress) {
        this.supplierAddress = supplierAddress;
    }

    public @NotBlank(message = "Employee name is required") @Size(max = 100, message = "Employee name must not exceed 100 characters") String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(
            @NotBlank(message = "Employee name is required") @Size(max = 100, message = "Employee name must not exceed 100 characters") String employeeName) {
        this.employeeName = employeeName;
    }

    public @NotNull(message = "Rate is required") @DecimalMin(value = "0.01", message = "Rate must be greater than 0") BigDecimal getRate() {
        return rate;
    }

    public void setRate(
            @NotNull(message = "Rate is required") @DecimalMin(value = "0.01", message = "Rate must be greater than 0") BigDecimal rate) {
        this.rate = rate;
    }

    public @NotBlank(message = "Currency is required") @Size(min = 3, max = 3, message = "Currency must be 3 characters") String getCurrency() {
        return currency;
    }

    public void setCurrency(
            @NotBlank(message = "Currency is required") @Size(min = 3, max = 3, message = "Currency must be 3 characters") String currency) {
        this.currency = currency;
    }

    public @NotNull(message = "From date is required") LocalDate getFromDate() {
        return fromDate;
    }

    public void setFromDate(@NotNull(message = "From date is required") LocalDate fromDate) {
        this.fromDate = fromDate;
    }

    public @NotNull(message = "To date is required") LocalDate getToDate() {
        return toDate;
    }

    public void setToDate(@NotNull(message = "To date is required") LocalDate toDate) {
        this.toDate = toDate;
    }

    public @NotNull(message = "Hours spent is required") @Min(value = 1, message = "Hours spent must be at least 1") Double getHoursSpent() {
        return hoursSpent;
    }

    public void setHoursSpent(
            @NotNull(message = "Hours spent is required") @Min(value = 1, message = "Hours spent must be at least 1") Double hoursSpent) {
        this.hoursSpent = hoursSpent;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public @Size(max = 1000, message = "Remarks must not exceed 1000 characters") String getRemarks() {
        return remarks;
    }

    public void setRemarks(@Size(max = 1000, message = "Remarks must not exceed 1000 characters") String remarks) {
        this.remarks = remarks;
    }

    // New getter and setter for timesheet data
    public TimesheetDataDTO getTimesheetData() {
        return timesheetData;
    }

    public void setTimesheetData(TimesheetDataDTO timesheetData) {
        this.timesheetData = timesheetData;
    }

    // Helper method to check if timesheet data is included
    public boolean hasTimesheetData() {
        return timesheetData != null && timesheetData.getEntries() != null && !timesheetData.getEntries().isEmpty();
    }


}
