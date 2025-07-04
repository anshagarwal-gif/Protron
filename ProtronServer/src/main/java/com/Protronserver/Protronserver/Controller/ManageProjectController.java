package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.ProjectRequestDTO;
import com.Protronserver.Protronserver.DTOs.ProjectUpdateDTO;
import com.Protronserver.Protronserver.Entities.Project;
import com.Protronserver.Protronserver.Service.ManageProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ManageProjectController {
    private static final Logger logger = LoggerFactory.getLogger(ManageProjectController.class);
    @Autowired
    private ManageProjectService manageProjectService;

    // Add a new project
    @PostMapping("/add")
    public ResponseEntity<Project> addProject(@RequestBody ProjectRequestDTO request) {
        logger.info("Hello");

        Project project = manageProjectService.addProject(request);
        return new ResponseEntity<>(project, HttpStatus.CREATED);
    }

    // Get all projects
    @GetMapping
    public List<Project> getAllProjects() {
        return manageProjectService.getAllProjects();
    }

    // Get a project by ID
    @GetMapping("/{id}")
    public Project getProjectById(@PathVariable("id") Long id) {
        return manageProjectService.getProjectById(id);
    }

    @PutMapping("/edit/{id}")
    public Project updateProject(@PathVariable("id") Long id, @RequestBody ProjectUpdateDTO projectUpdateDTO) {
        System.out.println(projectUpdateDTO.getSystemImpacted());
        return manageProjectService.updateProject(id, projectUpdateDTO);
    }

    @GetMapping("/user/active-projects")
    public ResponseEntity<List<Project>> getUserActiveProjects(@RequestParam(value = "userId", required = false) Long userId) {
        List<Project> projects = manageProjectService.getActiveProjectsInSameTenantByUser(userId);
        return ResponseEntity.ok(projects);
    }

}
