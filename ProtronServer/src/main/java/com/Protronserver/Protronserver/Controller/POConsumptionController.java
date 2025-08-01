package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.POConsumptionDTO;
import com.Protronserver.Protronserver.Entities.POConsumption;
import com.Protronserver.Protronserver.Service.POConsumptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/po-consumption")

public class POConsumptionController {

    @Autowired
    private POConsumptionService poConsumptionService;

    /**
     * Add new PO consumption
     */
    @PostMapping("/add")
    public ResponseEntity<?> addPOConsumption(@RequestBody POConsumptionDTO dto) {
        try {
            POConsumption savedConsumption = poConsumptionService.addPOConsumption(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedConsumption);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Validation Error: " + e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An unexpected error occurred: " + e.getMessage());
        }
    }

    /**
     * Update existing PO consumption
     */
    @PutMapping("/update/{utilizationId}")
    public ResponseEntity<?> updatePOConsumption(@PathVariable Long utilizationId,
            @RequestBody POConsumptionDTO dto) {
        try {
            POConsumption updatedConsumption = poConsumptionService.updatePOConsumption(utilizationId, dto);
            return ResponseEntity.ok(updatedConsumption);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Validation Error: " + e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An unexpected error occurred: " + e.getMessage());
        }
    }

    /**
     * Get all PO consumptions
     */
    @GetMapping("/all")
    public ResponseEntity<List<POConsumption>> getAllPOConsumptions() {
        try {
            List<POConsumption> consumptions = poConsumptionService.getAllPOConsumptions();
            return ResponseEntity.ok(consumptions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Get PO consumption by ID
     */
    @GetMapping("/{utilizationId}")
    public ResponseEntity<?> getPOConsumptionById(@PathVariable Long utilizationId) {
        try {
            POConsumption consumption = poConsumptionService.getPOConsumptionById(utilizationId);
            return ResponseEntity.ok(consumption);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An unexpected error occurred: " + e.getMessage());
        }
    }

    /**
     * Get all PO consumptions by PO number
     */
    @GetMapping("/by-po/{poNumber}")
    public ResponseEntity<List<POConsumption>> getPOConsumptionsByPoNumber(@PathVariable String poNumber) {
        try {
            List<POConsumption> consumptions = poConsumptionService.getPOConsumptionsByPoNumber(poNumber);
            return ResponseEntity.ok(consumptions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    

    @GetMapping("/by-po/{poId}")
    public ResponseEntity<List<POConsumption>> getPOConsumptionsByPoId(@PathVariable String poId) {
        try {
            List<POConsumption> consumptions = poConsumptionService.getPOConsumptionsByPoId(poId);
            return ResponseEntity.ok(consumptions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Get all PO consumptions by PO number and milestone
     */
    @GetMapping("/by-po-milestone/{poNumber}/{msName}")
    public ResponseEntity<List<POConsumption>> getPOConsumptionsByPoNumberAndMilestone(
            @PathVariable String poNumber,
            @PathVariable String msName) {
        try {
            List<POConsumption> consumptions = poConsumptionService
                    .getPOConsumptionsByPoNumberAndMilestone(poNumber, msName);
            return ResponseEntity.ok(consumptions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Get remaining balance for PO or milestone
     */
    @GetMapping("/balance/{poNumber}")
    public ResponseEntity<?> getPOConsumptionBalance(@PathVariable String poNumber,
            @RequestParam(required = false) Long msId) {
        try {
            BigDecimal balance = poConsumptionService.getPOConsumptionBalance(poNumber, msId);

            String balanceType = (msId != null)
                    ? "Milestone '" + msId + "'"
                    : "PO '" + poNumber + "'";

            return ResponseEntity.ok().body(new BalanceResponse(balanceType, balance));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An unexpected error occurred: " + e.getMessage());
        }
    }

    /**
     * Delete PO consumption by ID
     */
    @DeleteMapping("/delete/{utilizationId}")
    public ResponseEntity<?> deletePOConsumption(@PathVariable Long utilizationId) {
        try {
            poConsumptionService.deletePOConsumption(utilizationId);
            return ResponseEntity.ok()
                    .body("PO Consumption with ID " + utilizationId + " has been deleted successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An unexpected error occurred: " + e.getMessage());
        }
    }

    // Helper class for balance response
    public static class BalanceResponse {
        private String entity;
        private BigDecimal remainingBalance;

        public BalanceResponse(String entity, BigDecimal remainingBalance) {
            this.entity = entity;
            this.remainingBalance = remainingBalance;
        }

        public String getEntity() {
            return entity;
        }

        public void setEntity(String entity) {
            this.entity = entity;
        }

        public BigDecimal getRemainingBalance() {
            return remainingBalance;
        }

        public void setRemainingBalance(BigDecimal remainingBalance) {
            this.remainingBalance = remainingBalance;
        }
    }
}
