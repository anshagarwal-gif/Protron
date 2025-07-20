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

    @GetMapping("/{id}")
    public ResponseEntity<PODetails> getPOById(@PathVariable Long id) {
        return ResponseEntity.ok(poService.getPOById(id));
    }

    @GetMapping("/pobalance/{id}")
    public BigDecimal getPoBalance(@PathVariable Long id){
        return costDetailsService.getPOBalance(id);
    }

}
