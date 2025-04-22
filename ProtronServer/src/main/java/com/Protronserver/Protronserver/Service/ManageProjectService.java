package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.ProjectRequestDTO;
import com.Protronserver.Protronserver.DTOs.ProjectUpdateDTO;
import com.Protronserver.Protronserver.DTOs.TeamMemberRequestDTO;
import com.Protronserver.Protronserver.Entities.Project;
import com.Protronserver.Protronserver.Entities.ProjectTeam;
import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.Repository.ProjectRepository;
import com.Protronserver.Protronserver.Repository.ProjectTeamRepository;
import com.Protronserver.Protronserver.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ManageProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProjectTeamRepository projectTeamRepository;

    public Project addProject(ProjectRequestDTO request) {
        Project project = new Project();
        project.setProjectName(request.getProjectName());
        project.setProjectIcon(request.getProjectIcon());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setProjectCost(request.getProjectCost());
        project.setTenent(request.getTenent());

        // fetch the actual User object from the DB
        System.out.println(request.getProjectManagerId());
        User manager = userRepository.findByUserIdAndEndTimestampIsNull(request.getProjectManagerId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        project.setProjectManager(manager);

        project.setStartTimestamp(LocalDateTime.now());
        project.setEndTimestamp(null);
        project.setLastUpdatedBy(null);

        Project savedProject = projectRepository.save(project);

        // If project team members are provided, save them
        if (request.getProjectTeam() != null && !request.getProjectTeam().isEmpty()) {
            List<ProjectTeam> teamMembers = new ArrayList<>();

            for (TeamMemberRequestDTO memberDTO : request.getProjectTeam()) {
                User user = userRepository.findByUserIdAndEndTimestampIsNull(memberDTO.getUserId())
                        .orElseThrow(() -> new RuntimeException("Team member not found"));

                ProjectTeam teamMember = new ProjectTeam();
                teamMember.setProject(savedProject);
                teamMember.setUser(user);
                teamMember.setPricing(memberDTO.getPricing());
                teamMember.setEmpCode(user.getEmpCode());
                teamMember.setStatus(memberDTO.getStatus() != null ? memberDTO.getStatus() : "active");
                teamMember.setTaskType(memberDTO.getTaskType());
                teamMember.setUnit(memberDTO.getUnit());
                teamMember.setEstimatedReleaseDate(memberDTO.getEstimatedReleaseDate());

                teamMembers.add(projectTeamRepository.save(teamMember));
            }

            // Update project with team members
            savedProject.setProjectTeam(teamMembers);
        }
        return savedProject;
    }

    public List<Project> getAllProjects() {
        return projectRepository.findByEndTimestampIsNull();
    }

    public Project getProjectById(Long projectId) {
        return projectRepository.findByProjectIdAndEndTimestampIsNull(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + projectId));
    }

    public Project updateProject(Long id,ProjectUpdateDTO request) {
        Project existingProject = projectRepository.findByProjectIdAndEndTimestampIsNull(id)
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + id));

        // Mark old project as inactive (soft delete)
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) {
            existingProject.setLastUpdatedBy(user.getEmail());
            existingProject.setEndTimestamp(LocalDateTime.now());
        }
        projectRepository.save(existingProject);

        // Create a new version of the project with updated fields
        Project updatedProject = new Project();
        updatedProject.setProjectName(request.getProjectName() != null ? request.getProjectName() : existingProject.getProjectName());
        updatedProject.setProjectIcon(request.getProjectIcon() != null ? request.getProjectIcon() : existingProject.getProjectIcon());
        updatedProject.setStartDate(request.getStartDate() != null ? request.getStartDate() : existingProject.getStartDate());
        updatedProject.setEndDate(request.getEndDate() != null ? request.getEndDate() : existingProject.getEndDate());
        updatedProject.setProjectCost(request.getProjectCost() != null ? request.getProjectCost() : existingProject.getProjectCost());
        updatedProject.setStartTimestamp(LocalDateTime.now());
        updatedProject.setEndTimestamp(null);
//        updatedProject.setProjectTeam(existingProject.getProjectTeam());

        // Set manager if ID is passed
        if (request.getProjectManagerId() != null) {
            User manager = userRepository.findByUserIdAndEndTimestampIsNull(request.getProjectManagerId())
                    .orElseThrow(() -> new RuntimeException("Manager not found"));
            updatedProject.setProjectManager(manager);
        } else {
            updatedProject.setProjectManager(existingProject.getProjectManager());
        }

        List<ProjectTeam> projectTeams = existingProject.getProjectTeam();
        for(ProjectTeam team : projectTeams){
            team.setProject(updatedProject);
        }

        // Save new project
        return projectRepository.save(updatedProject);
    }

}
