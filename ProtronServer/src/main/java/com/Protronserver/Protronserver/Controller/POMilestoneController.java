package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.POMilestoneAddDTO;
import com.Protronserver.Protronserver.Entities.POMilestone;
import com.Protronserver.Protronserver.ResultDTOs.EligibleMilestone;
import com.Protronserver.Protronserver.Service.CostDetailsService;
import com.Protronserver.Protronserver.Service.POMilestoneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/po-milestone")
public class POMilestoneController {

    @Autowired
    private POMilestoneService poMilestoneService;

    @Autowired
    private CostDetailsService costDetailsService;

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

    @GetMapping("/po/{poId}")
    public ResponseEntity<List<POMilestone>> getMilestonesByPoId(@PathVariable Long poId) {
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

    @GetMapping("/getMilestoneForPo/{id}")
    public List<EligibleMilestone> getMilestoneForPo(@PathVariable Long id){
        return costDetailsService.getRemainingMilestones(id);
    }

    @GetMapping("/getMilestoneForPoForCon/{id}")
    public List<EligibleMilestone> getMilestoneForPoForCon(@PathVariable Long id){
        return costDetailsService.getRemainingMilestonesForCon(id);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteMilestone(@PathVariable Long id) {
        poMilestoneService.deleteMilestone(id);
        return ResponseEntity.ok("Milestone deleted successfully.");
    }

    @GetMapping("getMilestoneBalanceForPO/{poId}")
    public BigDecimal getMilestoneBalance(@PathVariable Long poId){
        return costDetailsService.getPoBalanceAfterMilestoneAndSrnWithoutMilestone(poId);
    }

}
