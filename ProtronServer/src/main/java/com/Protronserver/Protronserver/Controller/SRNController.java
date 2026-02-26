package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.SRNDTO;
import com.Protronserver.Protronserver.Entities.SRNDetails;
import com.Protronserver.Protronserver.Service.POService;
import com.Protronserver.Protronserver.Service.SRNService;
import com.Protronserver.Protronserver.Utils.SRNLinkedPayments;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/srn")

public class SRNController {

    @Autowired
    private SRNService srnService;

    @Autowired
    private POService poService;

    /**
     * Add a new SRN
     */
    @PostMapping("/add")
    public ResponseEntity<SRNDetails> addSRN(@RequestBody SRNDTO dto) {
        try {
            SRNDetails createdSRN = srnService.addSRN(dto);
            return ResponseEntity.ok(createdSRN);
        } catch (Exception e) {
            System.out.println(e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Update an existing SRN
     */
    @PutMapping("/edit/{id}")
    public ResponseEntity<?> updateSRN(@PathVariable Long id, @RequestBody SRNDTO dto) {
        try {
            SRNDetails updatedSRN = srnService.updateSRN(id, dto);
            return ResponseEntity.ok(updatedSRN);
        } catch (IllegalArgumentException e) {
            System.err.println("Validation error updating SRN with ID " + id + ": " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            System.err.println("Error updating SRN with ID " + id + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Failed to update SRN: " + e.getMessage());
        }
    }

    /**
     * Get SRN by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<SRNDetails> getSRNById(@PathVariable Long id) {
        try {
            SRNDetails srn = srnService.getSRNById(id);
            return ResponseEntity.ok(srn);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get all SRNs
     */
    @GetMapping("/all")
    public ResponseEntity<List<SRNDetails>> getAllSRNs() {
        try {
            List<SRNDetails> srnList = srnService.getAllSRNs();
            return ResponseEntity.ok(srnList);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /** Get SRNs by PO – accepts either numeric id (e.g. 123) or PO number (e.g. PO0345). */
    @GetMapping("/po/{idOrNumber}")
    public ResponseEntity<List<SRNDetails>> getSRNsByPoId(@PathVariable String idOrNumber) {
        try {
            Long poId = poService.resolvePoId(idOrNumber);
            List<SRNDetails> srnList = srnService.getSRNsByPoId(poId);
            return ResponseEntity.ok(srnList);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get SRNs by PO Number
     */
    @GetMapping("/po-number/{poNumber}")
    public ResponseEntity<List<SRNDetails>> getSRNsByPoNumber(@PathVariable String poNumber) {
        try {
            List<SRNDetails> srnList = srnService.getSRNsByPoNumber(poNumber);
            return ResponseEntity.ok(srnList);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Delete SRN by ID
     */
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteSRN(@PathVariable Long id) {
        try {
            srnService.deleteSRN(id);
            return ResponseEntity.ok("SRN deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to delete SRN");
        }
    }

    /**
     * Get SRNs by Milestone Name
     */
    @GetMapping("/milestone/{msName}")
    public ResponseEntity<List<SRNDetails>> getSRNsByMilestoneName(@PathVariable String msName) {
        try {
            List<SRNDetails> srnList = srnService.getSRNsByMilestoneName(msName);
            return ResponseEntity.ok(srnList);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /** Get total SRN amount by PO – accepts either numeric id or PO number (e.g. PO0345). */
    @GetMapping("/total-amount/po/{idOrNumber}")
    public ResponseEntity<Integer> getTotalSRNAmountByPoId(@PathVariable String idOrNumber) {
        try {
            Long poId = poService.resolvePoId(idOrNumber);
            Integer totalAmount = srnService.getTotalSRNAmountByPoId(poId);
            return ResponseEntity.ok(totalAmount);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/check")
    public ResponseEntity<Boolean> checkExistingSRNs(
            @RequestParam Long poId,
            @RequestParam(required = false) Long msId
    ) {
        try {
            boolean hasExistingSRNs = srnService.checkExistingSRNs(poId, msId);
            return ResponseEntity.ok(hasExistingSRNs);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/total-amount")
    public ResponseEntity<BigDecimal> getTotalSRNAmount(
            @RequestParam Long poId,
            @RequestParam(required = false) Long msId
    ) {
        try {
            BigDecimal totalAmount = srnService.getTotalSRNAmount(poId, msId);
            return ResponseEntity.ok(totalAmount);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get PO amount and linked milestone amount for a given SRN
     */
    @GetMapping("/{srnId}/linked-amounts")
    public ResponseEntity<SRNLinkedPayments> getLinkedAmountsForSrn(
            @PathVariable Long srnId
    ) {
        return ResponseEntity.ok(
                srnService.getLinkedAmountsForSrn(srnId)
        );
    }

}
