package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.TeamMemberEditDTO;
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
import java.util.List;
import java.util.Optional;

@Service
public class ManageTeamService {

    @Autowired
    private ProjectTeamRepository projectTeamRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    public ProjectTeam createProjectTeam(TeamMemberRequestDTO dto) {
        ProjectTeam team = new ProjectTeam();
        team.setPricing(dto.getPricing());
        team.setEmpCode(dto.getEmpCode());
        team.setStatus(dto.getStatus());
        team.setUnit(dto.getUnit());
        team.setTaskType(dto.getTaskType());
        team.setEstimatedReleaseDate(dto.getEstimatedReleaseDate());
        team.setStartTimestamp(dto.getStartTimestamp() != null ? dto.getStartTimestamp() : LocalDateTime.now());
        team.setEndTimestamp(dto.getEndTimestamp());
        team.setLastUpdatedBy(dto.getLastUpdatedBy());

        Optional<Project> project = projectRepository.findById(dto.getProjectId());
        Optional<User> user = userRepository.findById(dto.getUserId());

        if (project.isPresent() && user.isPresent()) {
            team.setProject(project.get());
            team.setUser(user.get());
            return projectTeamRepository.save(team);
        }

        throw new RuntimeException("Project or User not found");
    }

    public ProjectTeam getProjectTeamById(Long id) {
        return projectTeamRepository.findByProjectTeamIdAndEndTimestampIsNull(id)
                .orElseThrow(() -> new RuntimeException("Team Member not found"));
    }

    public ProjectTeam updateProjectTeam(Long id, TeamMemberEditDTO dto) {
        ProjectTeam team = getProjectTeamById(id);
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) {
            team.setLastUpdatedBy(user.getEmail());
            team.setEndTimestamp(LocalDateTime.now());
        }

        projectTeamRepository.save(team);

        ProjectTeam newVersionMember = new ProjectTeam();
        newVersionMember.setPricing(dto.getPricing());
        newVersionMember.setUnit(dto.getUnit());
        newVersionMember.setEstimatedReleaseDate(dto.getEstimatedReleaseDate());
        newVersionMember.setEmpCode(team.getEmpCode());
        newVersionMember.setStatus(team.getStatus());
        newVersionMember.setTaskType(dto.getTaskType());
        newVersionMember.setStartTimestamp(LocalDateTime.now());
        newVersionMember.setProject(team.getProject());
        newVersionMember.setUser(team.getUser());

        return projectTeamRepository.save(newVersionMember);

    }

    public ProjectTeam updateStatus(Long teamMemberId, String status) {
        ProjectTeam team = getProjectTeamById(teamMemberId);

        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) {
            team.setLastUpdatedBy(user.getEmail());
            team.setEndTimestamp(LocalDateTime.now());
        }

        ProjectTeam newVersionMember = new ProjectTeam();
        newVersionMember.setPricing(team.getPricing());
        newVersionMember.setUnit(team.getUnit());
        newVersionMember.setEstimatedReleaseDate(team.getEstimatedReleaseDate());
        newVersionMember.setEmpCode(team.getEmpCode());
        newVersionMember.setStatus(status);
        newVersionMember.setTaskType(team.getTaskType());
        newVersionMember.setStartTimestamp(LocalDateTime.now());
        newVersionMember.setProject(team.getProject());
        newVersionMember.setUser(team.getUser());

        return projectTeamRepository.save(newVersionMember);
    }

    public void deleteProjectTeam(Long id) {
        ProjectTeam team = getProjectTeamById(id);
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) {
            team.setLastUpdatedBy(user.getEmail());
            team.setEndTimestamp(LocalDateTime.now());
        }
        projectTeamRepository.save(team);
        // projectTeamRepository.delete(team);
    }

    public List<ProjectTeam> getProjectTeam(Long projectId) {
        return projectTeamRepository.findByProjectProjectIdAndEndTimestampIsNull(projectId);
    }

}
