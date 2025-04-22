package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.ProjectRequestDTO;
import com.Protronserver.Protronserver.DTOs.ProjectUpdateDTO;
import com.Protronserver.Protronserver.Entities.Project;
import com.Protronserver.Protronserver.Service.ManageProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ManageProjectController {

    @Autowired
    private ManageProjectService manageProjectService;

    // Add a new project
    @PostMapping("/add")
    public ResponseEntity<Project> addProject(@RequestBody ProjectRequestDTO request) {
        System.out.println(request.getProjectManagerId());
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
    public Project updateProject(@PathVariable("id") Long id, @RequestBody ProjectUpdateDTO projectUpdateDTO){
        return manageProjectService.updateProject(id, projectUpdateDTO);
    }

}
