package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.PODetailsDTO;
import com.Protronserver.Protronserver.Entities.PODetails;
import com.Protronserver.Protronserver.Service.CostDetailsService;
import com.Protronserver.Protronserver.Service.POService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/po")
public class POController {

    @Autowired
    private POService poService;

    @Autowired
    private CostDetailsService costDetailsService;

    @PostMapping("/add")
    public ResponseEntity<PODetails> addPO(@RequestBody PODetailsDTO poDetails) {
        PODetails savedPO = poService.addPO(poDetails);
        return ResponseEntity.ok(savedPO);
    }

    @PutMapping("/edit/{id}")
    public ResponseEntity<PODetails> updatePO(@PathVariable Long id, @RequestBody PODetailsDTO updatedPO) {
        PODetails updated = poService.updatePO(id, updatedPO);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/all")
    public ResponseEntity<List<PODetails>> getAllPOs() {
        return ResponseEntity.ok(poService.getAllPOs());
    }

    /** Accepts either numeric id (e.g. 123) or PO number string (e.g. PO0345). */
    @GetMapping("/{idOrNumber}")
    public ResponseEntity<PODetails> getPOByIdOrNumber(@PathVariable String idOrNumber) {
        if (idOrNumber == null || idOrNumber.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            Long id = Long.parseLong(idOrNumber);
            return ResponseEntity.ok(poService.getPOById(id));
        } catch (NumberFormatException e) {
            return ResponseEntity.ok(poService.getPOByPoNumber(idOrNumber));
        }
    }

    /** Accepts either numeric id or PO number (e.g. PO0345). */
    @GetMapping("/pobalance/{idOrNumber}")
    public BigDecimal getPoBalance(@PathVariable String idOrNumber) {
        Long poId = poService.resolvePoId(idOrNumber);
        return costDetailsService.getPOBalance(poId);
    }

    /** Accepts either numeric id or PO number (e.g. PO0345). */
    @GetMapping("/pobalance-con/{idOrNumber}")
    public BigDecimal getPoBalanceForConsumptions(@PathVariable String idOrNumber) {
        Long poId = poService.resolvePoId(idOrNumber);
        return costDetailsService.getPOBalanceBasedOnConsumption(poId);
    }

    /** Accepts either numeric id (e.g. 123) or PO number (e.g. PO0345). */
    @GetMapping("/{idOrNumber}/milestone-balance")
    public ResponseEntity<BigDecimal> getPoBalanceForMilestoneCreation(
            @PathVariable String idOrNumber) {
        Long poId = poService.resolvePoId(idOrNumber);
        return ResponseEntity.ok(
                costDetailsService.getPoBalanceForMilestoneCreation(poId)
        );
    }
}
