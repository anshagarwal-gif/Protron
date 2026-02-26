package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.POMilestoneAddDTO;
import com.Protronserver.Protronserver.Entities.POMilestone;
import com.Protronserver.Protronserver.ResultDTOs.EligibleMilestone;
import com.Protronserver.Protronserver.Service.CostDetailsService;
import com.Protronserver.Protronserver.Service.POMilestoneService;
import com.Protronserver.Protronserver.Service.POService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/po-milestone")
public class POMilestoneController {

    @Autowired
    private POMilestoneService poMilestoneService;

    @Autowired
    private CostDetailsService costDetailsService;

    @Autowired
    private POService poService;

    @PostMapping("/add")
    public ResponseEntity<POMilestone> addMilestone(@RequestBody POMilestoneAddDTO dto) {
        return ResponseEntity.ok(poMilestoneService.addMilestone(dto));
    }

    @PutMapping("/edit/{id}")
    public ResponseEntity<POMilestone> updateMilestone(@PathVariable Long id, @RequestBody POMilestoneAddDTO dto) {
        return ResponseEntity.ok(poMilestoneService.updateMilestone(id, dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<POMilestone> getMilestoneById(@PathVariable Long id) {
        return ResponseEntity.ok(poMilestoneService.getMilestoneByMsId(id));
    }

    @GetMapping("/all")
    public ResponseEntity<List<POMilestone>> getAllMilestones() {
        return ResponseEntity.ok(poMilestoneService.getAllMilestones());
    }

    /** Accepts either numeric id (e.g. 123) or PO number (e.g. PO0345). */
    @GetMapping("/po/{idOrNumber}")
    public ResponseEntity<List<POMilestone>> getMilestonesByPoId(@PathVariable String idOrNumber) {
        Long poId = poService.resolvePoId(idOrNumber);
        return ResponseEntity.ok(poMilestoneService.getMilestonesByPoId(poId));
    }

    @GetMapping("/milestonebalance/{id}/{Id}")
    public BigDecimal getMilestoneBalance(@PathVariable Long id, @PathVariable Long Id){
        return costDetailsService.getMilestoneBalance(id, Id);
    }

    @GetMapping("milestonebalance-consumption/{id}/{Id}")
    public BigDecimal getMilestoneBalanceForConsumption(@PathVariable Long id, @PathVariable Long Id){
        return costDetailsService.getMilestoneBalanceBasedOnConsumption(id, Id);
    }

    /** Accepts either numeric id or PO number (e.g. PO0345). */
    @GetMapping("/getMilestoneForPo/{idOrNumber}")
    public List<EligibleMilestone> getMilestoneForPo(@PathVariable String idOrNumber) {
        Long poId = poService.resolvePoId(idOrNumber);
        return costDetailsService.getRemainingMilestones(poId);
    }

    /** Accepts either numeric id or PO number (e.g. PO0345). */
    @GetMapping("/getMilestoneForPoForCon/{idOrNumber}")
    public List<EligibleMilestone> getMilestoneForPoForCon(@PathVariable String idOrNumber) {
        Long poId = poService.resolvePoId(idOrNumber);
        return costDetailsService.getRemainingMilestonesForCon(poId);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteMilestone(@PathVariable Long id) {
        poMilestoneService.deleteMilestone(id);
        return ResponseEntity.ok("Milestone deleted successfully.");
    }

    /** Accepts either numeric id or PO number (e.g. PO0345). */
    @GetMapping("getMilestoneBalanceForPO/{idOrNumber}")
    public BigDecimal getMilestoneBalance(@PathVariable String idOrNumber) {
        Long poId = poService.resolvePoId(idOrNumber);
        return costDetailsService.getPoBalanceAfterMilestoneAndSrnWithoutMilestone(poId);
    }

}
