package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.ProjectRequestDTO;
import com.Protronserver.Protronserver.DTOs.ProjectUpdateDTO;
import com.Protronserver.Protronserver.Entities.Project;
import com.Protronserver.Protronserver.Repository.ProjectRepository;
import com.Protronserver.Protronserver.ResultDTOs.ActiveProjectsDTO;
import com.Protronserver.Protronserver.ResultDTOs.ProjectDetailsDTO;
import com.Protronserver.Protronserver.ResultDTOs.SystemImpactedDTO;
import com.Protronserver.Protronserver.ResultDTOs.TeamMemberDTO;
import com.Protronserver.Protronserver.Service.ManageProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
public class ManageProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    private static final Logger logger = LoggerFactory.getLogger(ManageProjectController.class);
    @Autowired
    private ManageProjectService manageProjectService;

    // Add a new project
    @PostMapping("/add")
    public ResponseEntity<Long> addProject(@RequestBody ProjectRequestDTO request) {
        logger.info("Hello");

        Long project = manageProjectService.addProject(request);
        return new ResponseEntity<>(project, HttpStatus.CREATED);
    }

    // Get all projects
    @GetMapping
    public List<Project> getAllProjects() {
        return manageProjectService.getAllProjects();
    }

    // Get a project by ID
    @GetMapping("/{id}")
    public Map<String, Object> getProjectById(@PathVariable("id") Long projectId) {
        ProjectDetailsDTO project = manageProjectService.getProjectDetails(projectId);
        List<TeamMemberDTO> team = projectRepository.getTeamMembersForProject(projectId);
        List<SystemImpactedDTO> systems = projectRepository.getSystemsForProject(projectId);

        Map<String, Object> result = new HashMap<>();
        result.put("project", project);
        result.put("teamMembers", team);
        result.put("systemsImpacted", systems);

        return result;
    }

    @PutMapping("/edit/{id}")
    public Project updateProject(@PathVariable("id") Long id, @RequestBody ProjectUpdateDTO projectUpdateDTO) {
        System.out.println(projectUpdateDTO.getSystemImpacted());
        return manageProjectService.updateProject(id, projectUpdateDTO);
    }

    @DeleteMapping("/delete/{id}")
    public void deleteProject(@PathVariable("id") Long id){
        manageProjectService.deleteProject(id);
    }

    @GetMapping("/user/active-projects")
    public ResponseEntity<List<ActiveProjectsDTO>> getUserActiveProjects(@RequestParam(value = "userId", required = false) Long userId) {
        List<ActiveProjectsDTO> projects = manageProjectService.getActiveProjectsInSameTenantByUser(userId);
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/generate-code")
    public ResponseEntity<String> generateProjectCode() {
        String code = manageProjectService.generateNextProjectCode();
        return ResponseEntity.ok(code);
    }

    @PutMapping("/{id}/define-done")
    public ResponseEntity<String> updateDefineDone(
            @PathVariable("id") Long id,
            @RequestBody Map<String, String> requestBody) {

        if (!requestBody.containsKey("defineDone")) {
            return ResponseEntity.badRequest().body("defineDone field is required");
        }

        String defineDone = requestBody.get("defineDone");
        manageProjectService.updateDefineDone(id, defineDone);

        return ResponseEntity.ok("Define of Done updated successfully");
    }

    @GetMapping("/{id}/define-done")
    public ResponseEntity<Map<String, String>> getDefineDone(@PathVariable("id") Long id) {
        String defineDone = manageProjectService.getDefineDone(id);

        Map<String, String> response = new HashMap<>();
        response.put("defineDone", defineDone);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/name")
    public ResponseEntity<String> getProjectName(@PathVariable("id") Long id) {
        return ResponseEntity.ok(manageProjectService.getProjectNameById(id));
    }

}
