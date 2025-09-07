package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.ProjectRequestDTO;
import com.Protronserver.Protronserver.DTOs.ProjectUpdateDTO;
import com.Protronserver.Protronserver.DTOs.SystemImpactedDTO;
import com.Protronserver.Protronserver.DTOs.TeamMemberRequestDTO;
import com.Protronserver.Protronserver.Entities.*;
import com.Protronserver.Protronserver.Repository.*;

import com.Protronserver.Protronserver.ResultDTOs.ActiveProjectsDTO;
import com.Protronserver.Protronserver.ResultDTOs.ProjectDetailsDTO;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import jakarta.persistence.EntityNotFoundException;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
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

    @Autowired
    private RidaRepository ridaRepository;

    @Autowired
    private ReleaseRepository releaseRepository;

    @Autowired
    private SprintRepository sprintRepository;

    public Project addProject(ProjectRequestDTO request) {
        System.out.println(request.getProductOwner());
        Project project = new Project();
        project.setProjectCode(request.getProjectCode());
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

        project.setProductOwner(request.getProductOwner());
        project.setScrumMaster(request.getScrumMaster());
        project.setArchitect(request.getArchitect());
        project.setChiefScrumMaster(request.getChiefScrumMaster());
        project.setDeliveryLeader(request.getDeliveryLeader());
        project.setBusinessUnitFundedBy(request.getBusinessUnitFundedBy());
        project.setBusinessUnitDeliveredTo(request.getBusinessUnitDeliveredTo());
        project.setPriority(request.getPriority());
        project.setBusinessValueAmount(request.getBusinessValueAmount());
        project.setBusinessValueType(request.getBusinessValueType());

        project.setStartTimestamp(LocalDateTime.now());
        project.setEndTimestamp(null);
        project.setLastUpdatedBy(null);
        project.setCreatedOn(new Date());


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
//                teamMember.setPricing(memberDTO.getPricing());
                teamMember.setEmpCode(user.getEmpCode());
                teamMember.setStatus(memberDTO.getStatus() != null ? memberDTO.getStatus() : "active");
//                teamMember.setTaskType(memberDTO.getTaskType());
//                teamMember.setUnit(memberDTO.getUnit());
//                teamMember.setEstimatedReleaseDate(memberDTO.getEstimatedReleaseDate());
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

    public ProjectDetailsDTO getProjectDetails(Long projectId) {
        ProjectDetailsDTO dto = projectRepository.fetchProjectDetails(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        dto.setStatus(dto.getEndDate() != null ? "Completed" : "Active");

        if (dto.getStartDate() != null && dto.getEndDate() != null) {
            long days = ChronoUnit.DAYS.between(
                    dto.getStartDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate(),
                    dto.getEndDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate());
            dto.setDurationInDays((int) days);
        }

        return dto;
    }


    @Transactional
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
        updatedProject.setProjectCode(existingProject.getProjectCode());
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

        updatedProject.setProductOwner(request.getProductOwner());
        updatedProject.setScrumMaster(request.getScrumMaster());
        updatedProject.setArchitect(request.getArchitect());
        updatedProject.setChiefScrumMaster(request.getChiefScrumMaster());
        updatedProject.setDeliveryLeader(request.getDeliveryLeader());
        updatedProject.setBusinessUnitFundedBy(request.getBusinessUnitFundedBy());
        updatedProject.setBusinessUnitDeliveredTo(request.getBusinessUnitDeliveredTo());
        updatedProject.setPriority(request.getPriority());
        updatedProject.setCreatedOn(existingProject.getCreatedOn());
        updatedProject.setBusinessValueAmount(request.getBusinessValueAmount());
        updatedProject.setBusinessValueType(request.getBusinessValueType());

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

        ridaRepository.updateProjectForRidas(existingProject, updatedProject);
        releaseRepository.updateProjectForReleases(existingProject.getProjectId(), updatedProject.getProjectId(), updatedProject.getProjectName());
        sprintRepository.updateProjectForSprints(existingProject.getProjectId(), updatedProject.getProjectId());


        // Save new project
        return updatedProject;
    }

    public List<ActiveProjectsDTO> getActiveProjectsInSameTenantByUser(Long userId) {

        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (!(principal instanceof User user)) {
            throw new RuntimeException("Invalid user session");
        }

        return projectRepository.findActiveProjectsByUserInSameTenant(user.getUserId());
    }

    public void deleteProject(Long id){
        Project existingProject = projectRepository.findByProjectIdAndEndTimestampIsNull(id)
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + id));

        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) {
            existingProject.setLastUpdatedBy(user.getEmail());
            existingProject.setEndTimestamp(LocalDateTime.now());
        }
        projectRepository.save(existingProject);
    }

    public String generateNextProjectCode() {
        Long nextId = projectRepository.getNextSeriesId();
        return "PRJ-A" + String.format("%03d", nextId);
    }

    @Transactional
    public void updateDefineDone(Long id, String dod) {
        Project existingProject = projectRepository.findByProjectIdAndEndTimestampIsNull(id)
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + id));

        // Mark old project as inactive (soft delete)
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) {
            existingProject.setLastUpdatedBy(user.getEmail());
            existingProject.setEndTimestamp(LocalDateTime.now());
            projectRepository.save(existingProject);
        }

        // Create a new version of the project with updated defineDone
        Project updatedProject = new Project();
        updatedProject.setProjectCode(existingProject.getProjectCode());
        updatedProject.setTenant(existingProject.getTenant());
        updatedProject.setProjectName(existingProject.getProjectName());
        updatedProject.setProjectIcon(existingProject.getProjectIcon());
        updatedProject.setStartDate(existingProject.getStartDate());
        updatedProject.setEndDate(existingProject.getEndDate());
        updatedProject.setProjectCost(existingProject.getProjectCost());
        updatedProject.setUnit(existingProject.getUnit());
        updatedProject.setCreatedOn(existingProject.getCreatedOn());

        // Copy project-related fields
        updatedProject.setProjectManager(existingProject.getProjectManager());
        updatedProject.setSponsor(existingProject.getSponsor());
        updatedProject.setProductOwner(existingProject.getProductOwner());
        updatedProject.setScrumMaster(existingProject.getScrumMaster());
        updatedProject.setArchitect(existingProject.getArchitect());
        updatedProject.setChiefScrumMaster(existingProject.getChiefScrumMaster());
        updatedProject.setDeliveryLeader(existingProject.getDeliveryLeader());
        updatedProject.setBusinessUnitFundedBy(existingProject.getBusinessUnitFundedBy());
        updatedProject.setBusinessUnitDeliveredTo(existingProject.getBusinessUnitDeliveredTo());
        updatedProject.setPriority(existingProject.getPriority());
        updatedProject.setBusinessValueAmount(existingProject.getBusinessValueAmount());
        updatedProject.setBusinessValueType(existingProject.getBusinessValueType());

        // New field update
        updatedProject.setDefineDone(dod);

        // Metadata
        updatedProject.setStartTimestamp(LocalDateTime.now());
        updatedProject.setEndTimestamp(null);

        // Maintain relationships
        List<ProjectTeam> projectTeams = existingProject.getProjectTeam();
        for (ProjectTeam team : projectTeams) {
            team.setProject(updatedProject);
        }

        // Save the new project version
        projectRepository.save(updatedProject);

        ridaRepository.updateProjectForRidas(existingProject, updatedProject);
        releaseRepository.updateProjectForReleases(existingProject.getProjectId(), updatedProject.getProjectId(), updatedProject.getProjectName());
        sprintRepository.updateProjectForSprints(existingProject.getProjectId(), updatedProject.getProjectId());
    }

    public String getDefineDone(Long id) {
        Project project = projectRepository.findByProjectIdAndEndTimestampIsNull(id)
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + id));

        return project.getDefineDone();
    }

    public String getProjectNameById(Long id) {
        String projectName = projectRepository.findProjectNameById(id);
        if (projectName == null) {
            throw new RuntimeException("Project not found with ID: " + id);
        }
        return projectName;
    }

}
