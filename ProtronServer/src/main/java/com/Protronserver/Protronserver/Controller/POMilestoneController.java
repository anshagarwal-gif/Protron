package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.POMilestoneAddDTO;
import com.Protronserver.Protronserver.Entities.POMilestone;
import com.Protronserver.Protronserver.Service.POMilestoneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/po-milestone")
public class POMilestoneController {

    @Autowired
    private POMilestoneService poMilestoneService;

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

}
