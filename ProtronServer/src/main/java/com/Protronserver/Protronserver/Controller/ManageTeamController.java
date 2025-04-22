package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.TeamMemberEditDTO;
import com.Protronserver.Protronserver.DTOs.TeamMemberRequestDTO;
import com.Protronserver.Protronserver.Entities.ProjectTeam;
import com.Protronserver.Protronserver.Service.ManageTeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/project-team")
public class ManageTeamController {

    @Autowired
    private ManageTeamService manageTeamService;

    @PostMapping("/add")
    public ResponseEntity<ProjectTeam> addTeamMember(@RequestBody TeamMemberRequestDTO dto) {
        ProjectTeam saved = manageTeamService.createProjectTeam(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/edit/{id}")
    public ProjectTeam update(@PathVariable Long id, @RequestBody TeamMemberEditDTO dto) {
        return manageTeamService.updateProjectTeam(id, dto);
    }

    @PatchMapping("/{id}/status")
    public ProjectTeam updateStatus(@PathVariable Long id, @RequestParam String status) {
        return manageTeamService.updateStatus(id, status);
    }

    @DeleteMapping("/delete/{id}")
    public void delete(@PathVariable Long id) {
        manageTeamService.deleteProjectTeam(id);
    }

    @GetMapping("/list/{projectId}")
    public ResponseEntity<List<ProjectTeam>> getProjectTeam(@PathVariable Long projectId) {
        return ResponseEntity.ok(manageTeamService.getProjectTeam(projectId));
    }

}
