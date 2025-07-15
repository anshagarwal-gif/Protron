package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.ProjectRequestDTO;
import com.Protronserver.Protronserver.DTOs.ProjectUpdateDTO;
import com.Protronserver.Protronserver.DTOs.SystemImpactedDTO;
import com.Protronserver.Protronserver.DTOs.TeamMemberRequestDTO;
import com.Protronserver.Protronserver.Entities.*;
import com.Protronserver.Protronserver.Repository.*;

import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import jakarta.persistence.EntityNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class ManageProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantRepository tenantRepository;
    @Autowired
    private ProjectTeamRepository projectTeamRepository;

    @Autowired
    private SystemImpactedRepository systemImpactedRepository;

    @Autowired
    private ManageSystemImpactedService manageSystemImpactedService;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    public Project addProject(ProjectRequestDTO request) {
        Project project = new Project();
        project.setProjectName(request.getProjectName());
        project.setProjectIcon(request.getProjectIcon());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setProjectCost(request.getProjectCost());
        Tenant tenant = tenantRepository.findById(request.getTenent())
                .orElseThrow(() -> new EntityNotFoundException("Tenant Not found"));
        project.setTenant(tenant);
        project.setUnit(request.getUnit());
        if (request.getProjectManagerId() != null) {
            User manager = userRepository.findByUserIdAndEndTimestampIsNull(request.getProjectManagerId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            project.setProjectManager(manager);
        }

        if (request.getSponsor() != null) {
            User sponsor = userRepository.findByUserIdAndEndTimestampIsNull(request.getSponsor())
                    .orElseThrow(() -> new RuntimeException("User not found for sponsor"));
            project.setSponsor(sponsor);
        }

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
                teamMember.setStartTimestamp(LocalDateTime.now());
                teamMember.setEndTimestamp(null);
                teamMember.setLastUpdatedBy(null);

                teamMembers.add(projectTeamRepository.save(teamMember));
            }

            // Update project with team members
            savedProject.setProjectTeam(teamMembers);
        }

        if (request.getSystemImpacted() != null && !request.getSystemImpacted().isEmpty()) {
            List<Systemimpacted> systems = new ArrayList<>();

            for (String systemName : request.getSystemImpacted()) {
                Systemimpacted system = new Systemimpacted();
                system.setSystemName(systemName);
                system.setProject(savedProject);
                system.setTenant(tenant);

                systems.add(systemImpactedRepository.save(system));
            }
            savedProject.setSystemImpacted(systems);
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

    public Project updateProject(Long id, ProjectUpdateDTO request) {
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
        updatedProject.setTenant(existingProject.getTenant());
        updatedProject.setProjectName(
                request.getProjectName() != null ? request.getProjectName() : existingProject.getProjectName());
        updatedProject.setProjectIcon(
                request.getProjectIcon() != null ? request.getProjectIcon() : existingProject.getProjectIcon());
        updatedProject
                .setStartDate(request.getStartDate() != null ? request.getStartDate() : existingProject.getStartDate());
        updatedProject.setEndDate(request.getEndDate() != null ? request.getEndDate() : existingProject.getEndDate());
        updatedProject.setProjectCost(
                request.getProjectCost() != null ? request.getProjectCost() : existingProject.getProjectCost());
        updatedProject.setStartTimestamp(LocalDateTime.now());
        updatedProject.setEndTimestamp(null);
        updatedProject.setUnit(request.getUnit() != null ? request.getUnit() : existingProject.getUnit());
        // updatedProject.setProjectTeam(existingProject.getProjectTeam());

        // Set manager if ID is passed
        if (request.getProjectManagerId() != null) {
            User manager = userRepository.findByUserIdAndEndTimestampIsNull(request.getProjectManagerId())
                    .orElseThrow(() -> new RuntimeException("Manager not found"));
            updatedProject.setProjectManager(manager);
        } else {
            updatedProject.setProjectManager(existingProject.getProjectManager());
        }

        if (request.getSponsorId() != null) {
            User sponsor = userRepository.findByUserIdAndEndTimestampIsNull(request.getSponsorId())
                    .orElseThrow(() -> new RuntimeException("Sponsor not found"));
            updatedProject.setSponsor(sponsor);
        } else {
            updatedProject.setSponsor(existingProject.getSponsor());
        }

        List<ProjectTeam> projectTeams = existingProject.getProjectTeam();
        for (ProjectTeam team : projectTeams) {
            team.setProject(updatedProject);
        }

        updatedProject = projectRepository.save(updatedProject);

        if (request.getRemovedSystems() != null && !request.getRemovedSystems().isEmpty()) {
            manageSystemImpactedService.handleRemovedSystems(request.getRemovedSystems());
        }

        if (request.getSystemImpacted() != null && !request.getSystemImpacted().isEmpty()) {
            manageSystemImpactedService.handleUpdatedAndNewSystems(request.getSystemImpacted(), updatedProject);
        } else {
            manageSystemImpactedService.associateExistingSystemsWithNewProject(existingProject.getSystemImpacted(), updatedProject);
        }


        // Save new project
        return updatedProject;
    }

    public List<Project> getActiveProjectsInSameTenantByUser(Long userId) {

        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (!(principal instanceof User user)) {
            throw new RuntimeException("Invalid user session");
        }

        return projectRepository.findActiveProjectsByUserInSameTenant(user.getUserId());
    }

}
