package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.Entities.*;
import com.Protronserver.Protronserver.Service.*;
import com.Protronserver.Protronserver.DTOs.*;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/budget-allocations")
public class BudgetAllocationController {

    @Autowired
    private BudgetAllocationService budgetAllocationService;

    @Autowired
    private BudgetLineService budgetLineService;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    @Autowired
    private SystemMasterService systemMasterService;

    /**
     * Add a new budget allocation
     */
    @PostMapping
    public ResponseEntity<?> addBudgetAllocation(@Valid @RequestBody BudgetAllocationRequest request) {
        try {
            // Validate that budget line exists
            Optional<BudgetLine> budgetLineOpt = budgetLineService.findById(request.getBudgetLineId());
            if (!budgetLineOpt.isPresent()) {
                return ResponseEntity.badRequest().body("Budget line not found with ID: " + request.getBudgetLineId());
            }

            BudgetLine budgetLine = budgetLineOpt.get();

            // Validate allocation amount is positive
            if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest()
                        .body("Budget allocation failed! The allocation amount must be greater than zero.\n\n"
                                + "Please enter a valid positive amount.");
            }

            // Validate allocation amount is not unreasonably large
            if (request.getAmount().compareTo(budgetLine.getAmountApproved().multiply(new BigDecimal("10"))) > 0) {
                return ResponseEntity.badRequest()
                        .body("Budget allocation failed! The requested amount is unreasonably large.\n\n"
                                + "The allocation amount cannot be more than 10 times the approved budget.\n"
                                + "Please review and adjust the amount.");
            }

            // Validate allocation amount doesn't exceed available budget
            BigDecimal currentAllocations = budgetAllocationService
                    .getTotalAllocationAmountByBudgetLineId(request.getBudgetLineId());
            BigDecimal newTotal = currentAllocations.add(request.getAmount());
            BigDecimal remainingBudget = budgetLine.getAmountApproved().subtract(currentAllocations);

            if (newTotal.compareTo(budgetLine.getAmountApproved()) > 0) {
                String errorMessage = String.format(
                        "Budget allocation failed! The requested amount (%s %s) exceeds the available budget.\n\n"
                        + "Budget Details:\n"
                        + "• Total Approved Budget: %s %s\n"
                        + "• Already Allocated: %s %s\n"
                        + "• Remaining Budget: %s %s\n"
                        + "• Requested Amount: %s %s\n\n"
                        + "Please reduce the allocation amount to %s %s or less.",
                        budgetLine.getCurrency(), request.getAmount().toString(),
                        budgetLine.getCurrency(), budgetLine.getAmountApproved().toString(),
                        budgetLine.getCurrency(), currentAllocations.toString(),
                        budgetLine.getCurrency(), remainingBudget.toString(),
                        budgetLine.getCurrency(), request.getAmount().toString(),
                        budgetLine.getCurrency(), remainingBudget.toString());
                return ResponseEntity.badRequest().body(errorMessage);
            }

            // Create allocation entity
            BudgetAllocation allocation = new BudgetAllocation();
            allocation.setBudgetLine(budgetLine);

            // Automatically set tenant ID from logged-in user (same as project module)
            String currentTenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId().toString();
            allocation.setTenantId(currentTenantId);

            allocation.setVendorName(request.getVendorName());

// ✅ Validation: Either vendorName OR System is required
            if ((request.getVendorName() == null || request.getVendorName().trim().isEmpty())) {
                if (request.getSystemId() == null
                        && (request.getSystemName() == null || request.getSystemName().trim().isEmpty())) {
                    return ResponseEntity.badRequest().body("Either Vendor Name or System is required");
                }
            }

// Handle system only if provided
            if (request.getSystemId() != null) {
                // Use existing system from SystemMaster
                SystemMaster system = systemMasterService.getSystemById(request.getSystemId());
                if (system == null) {
                    return ResponseEntity.badRequest().body("System not found with ID: " + request.getSystemId());
                }
                allocation.setSystem(system);
                allocation.setSystemName(system.getSystemName()); // Set system name for consistency
            } else if (request.getSystemName() != null && !request.getSystemName().trim().isEmpty()) {
                // Use custom system name
                allocation.setSystem(null);
                allocation.setSystemName(request.getSystemName().trim());
            } else {
                // If vendorName is present, it's fine to skip system
                allocation.setSystem(null);
                allocation.setSystemName(null);
            }

            allocation.setAmount(request.getAmount());
            allocation.setRemarks(request.getRemarks());
            allocation.setStartTimestamp(LocalDateTime.now());
            allocation.setEndTimestamp(null);
            allocation.setLastUpdatedBy(null);

            // Save allocation
            BudgetAllocation savedAllocation = budgetAllocationService.save(allocation);

            // Update budget line amounts
            BigDecimal totalAllocated = budgetAllocationService
                    .getTotalAllocationAmountByBudgetLineId(request.getBudgetLineId());
            BigDecimal amountAvailable = budgetLine.getAmountApproved().subtract(totalAllocated);
            budgetLineService.updateBudgetAmounts(request.getBudgetLineId(), budgetLine.getAmountUtilized(),
                    amountAvailable);

            BudgetAllocationResponse response = convertToResponse(savedAllocation);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            String errorMessage = String.format(
                    "Failed to create budget allocation!\n\n"
                    + "Error Details:\n"
                    + "• Error Type: %s\n"
                    + "• Error Message: %s\n\n"
                    + "Possible Causes:\n"
                    + "• Database connection issues\n"
                    + "• Invalid data format\n"
                    + "• Insufficient permissions\n"
                    + "• Budget line not found\n\n"
                    + "Please check your input and try again. If the problem persists, contact system administrator.",
                    e.getClass().getSimpleName(),
                    e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorMessage);
        }
    }

    /**
     * Get budget allocation by ID
     */
    @GetMapping("/{allocationId}")
    public ResponseEntity<?> getBudgetAllocation(@PathVariable Integer allocationId) {
        try {
            Optional<BudgetAllocation> allocationOpt = budgetAllocationService.findById(allocationId);

            if (!allocationOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            BudgetAllocationResponse response = convertToResponse(allocationOpt.get());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving budget allocation: " + e.getMessage());
        }
    }

    /**
     * Get all budget allocations
     */
    @GetMapping
    public ResponseEntity<?> getAllBudgetAllocations() {
        try {
            List<BudgetAllocation> allocations = budgetAllocationService.findAll();
            List<BudgetAllocationResponse> responses = allocations.stream()
                    .map(this::convertToResponse)
                    .collect(java.util.stream.Collectors.toList());

            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving budget allocations: " + e.getMessage());
        }
    }

    /**
     * Get budget allocations by budget line ID
     */
    @GetMapping("/budget/{budgetLineId}")
    public ResponseEntity<?> getAllocationsByBudgetLine(@PathVariable Integer budgetLineId) {
        try {
            List<BudgetAllocation> allocations = budgetAllocationService.findByBudgetLineId(budgetLineId);
            List<BudgetAllocationResponse> responses = allocations.stream()
                    .map(this::convertToResponse)
                    .collect(java.util.stream.Collectors.toList());

            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving allocations by budget line: " + e.getMessage());
        }
    }

    /**
     * Get budget allocations by tenant ID
     */
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<?> getAllocationsByTenant(@PathVariable String tenantId) {
        try {
            List<BudgetAllocation> allocations = budgetAllocationService.findByTenantId(tenantId);
            List<BudgetAllocationResponse> responses = allocations.stream()
                    .map(this::convertToResponse)
                    .collect(java.util.stream.Collectors.toList());

            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving allocations by tenant: " + e.getMessage());
        }
    }

    /**
     * Get budget allocations by vendor name
     */
    @GetMapping("/vendor/{vendorName}")
    public ResponseEntity<?> getAllocationsByVendor(@PathVariable String vendorName) {
        try {
            List<BudgetAllocation> allocations = budgetAllocationService.findByVendorName(vendorName);
            List<BudgetAllocationResponse> responses = allocations.stream()
                    .map(this::convertToResponse)
                    .collect(java.util.stream.Collectors.toList());

            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving allocations by vendor: " + e.getMessage());
        }
    }

    /**
     * Update budget allocation (soft update with versioning)
     */
    @PutMapping("/{allocationId}")
    public ResponseEntity<?> updateBudgetAllocation(@PathVariable Integer allocationId,
                                                    @Valid @RequestBody BudgetAllocationRequest request) {
        try {
            Optional<BudgetAllocation> existingAllocationOpt = budgetAllocationService.findById(allocationId);

            if (!existingAllocationOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            BudgetAllocation existingAllocation = existingAllocationOpt.get();
            BudgetLine budgetLine = existingAllocation.getBudgetLine();

            // Validate allocation amount is positive
            if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest()
                        .body("Budget allocation update failed! The allocation amount must be greater than zero.\n\n"
                                + "Please enter a valid positive amount.");
            }

            // Validate allocation amount is not unreasonably large
            if (request.getAmount().compareTo(budgetLine.getAmountApproved().multiply(new BigDecimal("10"))) > 0) {
                return ResponseEntity.badRequest()
                        .body("Budget allocation update failed! The requested amount is unreasonably large.\n\n"
                                + "The allocation amount cannot be more than 10 times the approved budget.\n"
                                + "Please review and adjust the amount.");
            }

            // Calculate new total allocations (excluding current allocation)
            BigDecimal currentAllocations = budgetAllocationService
                    .getTotalAllocationAmountByBudgetLineId(budgetLine.getBudgetId());
            BigDecimal allocationsWithoutCurrent = currentAllocations.subtract(existingAllocation.getAmount());
            BigDecimal newTotal = allocationsWithoutCurrent.add(request.getAmount());

            if (newTotal.compareTo(budgetLine.getAmountApproved()) > 0) {
                String errorMessage = String.format(
                        "Budget allocation update failed! The requested amount (%s %s) exceeds the available budget.\n\n"
                                + "Budget Details:\n"
                                + "• Total Approved Budget: %s %s\n"
                                + "• Already Allocated (excluding current): %s %s\n"
                                + "• Remaining Budget: %s %s\n"
                                + "• Requested Amount: %s %s\n\n"
                                + "Please reduce the allocation amount to %s %s or less.",
                        budgetLine.getCurrency(), request.getAmount().toString(),
                        budgetLine.getCurrency(), budgetLine.getAmountApproved().toString(),
                        budgetLine.getCurrency(), allocationsWithoutCurrent.toString(),
                        budgetLine.getCurrency(),
                        budgetLine.getAmountApproved().subtract(allocationsWithoutCurrent).toString(),
                        budgetLine.getCurrency(), request.getAmount().toString(),
                        budgetLine.getCurrency(),
                        budgetLine.getAmountApproved().subtract(allocationsWithoutCurrent).toString());
                return ResponseEntity.badRequest().body(errorMessage);
            }

            boolean hasVendor = request.getVendorName() != null && !request.getVendorName().trim().isEmpty();
            boolean hasSystemId = request.getSystemId() != null;
            boolean hasSystemName = request.getSystemName() != null && !request.getSystemName().trim().isEmpty();

            if (!hasVendor && !hasSystemId && !hasSystemName) {
                return ResponseEntity.badRequest().body("At least Vendor Name or System (ID/Name) is required");
            }

            // --- Soft close the old allocation ---
            String updatedBy = loggedInUserUtils.getLoggedInUser().getEmail();

            existingAllocation.setEndTimestamp(LocalDateTime.now());
            existingAllocation.setLastUpdatedBy(updatedBy);
            budgetAllocationService.save(existingAllocation);

            // --- Create a new allocation record with updated values ---
            BudgetAllocation newAllocation = new BudgetAllocation();
            newAllocation.setBudgetLine(budgetLine);

            if (hasVendor) {
                newAllocation.setVendorName(request.getVendorName().trim());
            }

            if (hasSystemId) {
                SystemMaster system = systemMasterService.getSystemById(request.getSystemId());
                if (system == null) {
                    return ResponseEntity.badRequest().body("System not found with ID: " + request.getSystemId());
                }
                newAllocation.setSystem(system);
                newAllocation.setSystemName(system.getSystemName());
            } else if (hasSystemName) {
                newAllocation.setSystem(null);
                newAllocation.setSystemName(request.getSystemName().trim());
            }

            newAllocation.setAmount(request.getAmount());
            newAllocation.setRemarks(request.getRemarks());

            // Set tenant from logged in user
            String currentTenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId().toString();
            newAllocation.setTenantId(currentTenantId);

            newAllocation.setStartTimestamp(LocalDateTime.now());

            BudgetAllocation savedAllocation = budgetAllocationService.save(newAllocation);

            // Update budget line amounts
            BigDecimal totalAllocated = budgetAllocationService
                    .getTotalAllocationAmountByBudgetLineId(budgetLine.getBudgetId());
            BigDecimal amountAvailable = budgetLine.getAmountApproved().subtract(totalAllocated);
            budgetLineService.updateBudgetAmounts(budgetLine.getBudgetId(), budgetLine.getAmountUtilized(),
                    amountAvailable);

            BudgetAllocationResponse response = convertToResponse(savedAllocation);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            String errorMessage = String.format(
                    "Failed to update budget allocation!\n\n"
                            + "Error Details:\n"
                            + "• Error Type: %s\n"
                            + "• Error Message: %s\n\n"
                            + "Possible Causes:\n"
                            + "• Database connection issues\n"
                            + "• Invalid data format\n"
                            + "• Allocation not found\n"
                            + "• Insufficient permissions\n\n"
                            + "Please check your input and try again. If the problem persists, contact system administrator.",
                    e.getClass().getSimpleName(),
                    e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorMessage);
        }
    }

    
    @DeleteMapping("/{allocationId}")
    public ResponseEntity<?> deleteBudgetAllocation(@PathVariable Integer allocationId) {
        try {
            Optional<BudgetAllocation> allocationOpt = budgetAllocationService.findById(allocationId);

            if (!allocationOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            BudgetAllocation allocation = allocationOpt.get();
            BudgetLine budgetLine = allocation.getBudgetLine();

            // --- Soft delete instead of physical delete ---
            String updatedBy = loggedInUserUtils.getLoggedInUser().getEmail();

            allocation.setEndTimestamp(LocalDateTime.now());
            allocation.setLastUpdatedBy(updatedBy);
            budgetAllocationService.save(allocation);

            // --- Update budget line amounts after soft deletion ---
            BigDecimal totalAllocated = budgetAllocationService
                    .getTotalAllocationAmountByBudgetLineId(budgetLine.getBudgetId());
            BigDecimal amountAvailable = budgetLine.getAmountApproved().subtract(totalAllocated);
            budgetLineService.updateBudgetAmounts(
                    budgetLine.getBudgetId(),
                    budgetLine.getAmountUtilized(),
                    amountAvailable
            );

            String successMessage = String.format(
                    "Budget allocation deleted successfully (soft delete)!\n\n"
                            + "Deleted Allocation Details:\n"
                            + "• Tenant ID: %s\n"
                            + "• Vendor: %s\n"
                            + "• System: %s\n"
                            + "• Amount: %s %s\n"
                            + "• Remarks: %s\n\n"
                            + "Updated Budget Status:\n"
                            + "• Total Approved: %s %s\n"
                            + "• Remaining Allocated: %s %s\n"
                            + "• Available Budget: %s %s",
                    allocation.getTenantId(),
                    allocation.getVendorName(),
                    allocation.getSystemName() != null ? allocation.getSystemName()
                            : (allocation.getSystem() != null ? allocation.getSystem().getSystemName() : "N/A"),
                    budgetLine.getCurrency(), allocation.getAmount().toString(),
                    allocation.getRemarks() != null ? allocation.getRemarks() : "N/A",
                    budgetLine.getCurrency(), budgetLine.getAmountApproved().toString(),
                    budgetLine.getCurrency(), totalAllocated.toString(),
                    budgetLine.getCurrency(), amountAvailable.toString()
            );

            return ResponseEntity.ok(successMessage);

        } catch (Exception e) {
            String errorMessage = String.format(
                    "Failed to delete budget allocation!\n\n"
                            + "Error Details:\n"
                            + "• Error Type: %s\n"
                            + "• Error Message: %s\n\n"
                            + "Possible Causes:\n"
                            + "• Database connection issues\n"
                            + "• Foreign key constraints\n"
                            + "• Insufficient permissions\n\n"
                            + "Please try again or contact system administrator if the problem persists.",
                    e.getClass().getSimpleName(),
                    e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorMessage);
        }
    }


    /**
     * Get allocation summary by budget line
     */
    @GetMapping("/summary/budget/{budgetLineId}")
    public ResponseEntity<?> getAllocationSummary(@PathVariable Integer budgetLineId) {
        try {
            List<BudgetAllocation> allocations = budgetAllocationService.findByBudgetLineId(budgetLineId);
            BigDecimal totalAllocated = budgetAllocationService.getTotalAllocationAmountByBudgetLineId(budgetLineId);
            Long allocationCount = budgetAllocationService.countAllocationsByBudgetLineId(budgetLineId);

            Optional<BudgetLine> budgetLineOpt = budgetLineService.findById(budgetLineId);
            if (!budgetLineOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            BudgetLine budgetLine = budgetLineOpt.get();
            BigDecimal remainingAmount = budgetLine.getAmountApproved().subtract(totalAllocated);

            AllocationSummaryResponse summary = new AllocationSummaryResponse();
            summary.setBudgetLineId(budgetLineId);
            summary.setBudgetLineName(budgetLine.getBudgetName());
            summary.setTotalApproved(budgetLine.getAmountApproved());
            summary.setTotalAllocated(totalAllocated);
            summary.setRemainingAmount(remainingAmount);
            summary.setAllocationCount(allocationCount);
            summary.setCurrency(budgetLine.getCurrency());

            return ResponseEntity.ok(summary);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving allocation summary: " + e.getMessage());
        }
    }

    /**
     * Convert BudgetAllocation entity to response DTO
     */
    private BudgetAllocationResponse convertToResponse(BudgetAllocation allocation) {
        BudgetAllocationResponse response = new BudgetAllocationResponse();
        response.setAllocationId(allocation.getAllocationId());
        response.setBudgetLineId(allocation.getBudgetLine().getBudgetId());
        response.setBudgetLineName(allocation.getBudgetLine().getBudgetName());
        response.setTenantId(allocation.getTenantId());
        response.setVendorName(allocation.getVendorName());
        // Set system name - prioritize systemName field, fallback to system entity
        response.setSystemName(allocation.getSystemName() != null ? allocation.getSystemName()
                : (allocation.getSystem() != null ? allocation.getSystem().getSystemName() : null));
        response.setAmount(allocation.getAmount());
        response.setRemarks(allocation.getRemarks());
        return response;
    }
}
