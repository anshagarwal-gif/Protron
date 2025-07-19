package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.SRNDTO;
import com.Protronserver.Protronserver.Entities.SRNDetails;
import com.Protronserver.Protronserver.Service.SRNService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/srn")

public class SRNController {

    @Autowired
    private SRNService srnService;

    /**
     * Add a new SRN
     */
    @PostMapping("/add")
    public ResponseEntity<SRNDetails> addSRN(@RequestBody SRNDTO dto) {
        try {
            SRNDetails createdSRN = srnService.addSRN(dto);
            return ResponseEntity.ok(createdSRN);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Update an existing SRN
     */
    @PutMapping("/edit/{id}")
    public ResponseEntity<SRNDetails> updateSRN(@PathVariable Long id, @RequestBody SRNDTO dto) {
        try {
            SRNDetails updatedSRN = srnService.updateSRN(id, dto);
            return ResponseEntity.ok(updatedSRN);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
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

    /**
     * Get SRNs by PO ID
     */
    @GetMapping("/po/{poId}")
    public ResponseEntity<List<SRNDetails>> getSRNsByPoId(@PathVariable Long poId) {
        try {
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

    /**
     * Get total SRN amount by PO ID
     */
    @GetMapping("/total-amount/po/{poId}")
    public ResponseEntity<Integer> getTotalSRNAmountByPoId(@PathVariable Long poId) {
        try {
            Integer totalAmount = srnService.getTotalSRNAmountByPoId(poId);
            return ResponseEntity.ok(totalAmount);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
