package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.SystemImpactedDTO;
import com.Protronserver.Protronserver.Entities.Project;
import com.Protronserver.Protronserver.Entities.ProjectTeam;
import com.Protronserver.Protronserver.Entities.Systemimpacted;
import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.Repository.ProjectTeamRepository;
import com.Protronserver.Protronserver.Repository.SystemImpactedRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ManageSystemImpactedService {

    @Autowired
    private SystemImpactedRepository systemImpactedRepository;

    @Autowired
    private ProjectTeamRepository projectTeamRepository;

    public void handleRemovedSystems(List<Long> removedSystemIds) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        for (Long systemId : removedSystemIds) {
            // Unlink all teams using this system
            List<ProjectTeam> teamsWithSystem = projectTeamRepository.findBySystemimpacted_SystemId(systemId);
            for (ProjectTeam team : teamsWithSystem) {
                team.setSystemimpacted(null);
            }
            projectTeamRepository.saveAll(teamsWithSystem);

            // Soft delete the system
            Systemimpacted system = systemImpactedRepository.findById(systemId)
                    .orElseThrow(() -> new RuntimeException("System not found.!"));

            if (principal instanceof User user) {
                system.setEndTimestamp(LocalDateTime.now());
                system.setLastUpdatedBy(user.getEmail());
            }

            systemImpactedRepository.save(system);
        }
    }

    public void handleUpdatedAndNewSystems(List<SystemImpactedDTO> systemDTOs, Project updatedProject) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        for (SystemImpactedDTO dto : systemDTOs) {
            if (dto.getSystemId() != null) {
                Systemimpacted oldSystem = systemImpactedRepository.findById(dto.getSystemId())
                        .orElseThrow(() -> new RuntimeException("System Not found with ID: " + dto.getSystemId()));

                
                boolean isChanged = !dto.getSystemName().equals(oldSystem.getSystemName());

                if (isChanged) {
                    // Soft delete old version
                    if (principal instanceof User user) {
                        oldSystem.setEndTimestamp(LocalDateTime.now());
                        oldSystem.setLastUpdatedBy(user.getEmail());
                    }
                    systemImpactedRepository.save(oldSystem);

                    // Create new version
                    Systemimpacted newSystem = new Systemimpacted();
                    newSystem.setSystemName(dto.getSystemName());
                    newSystem.setProject(updatedProject);
                    newSystem.setTenant(updatedProject.getTenant());
                    newSystem.setStartTimestamp(LocalDateTime.now());
                    newSystem.setEndTimestamp(null);
                    newSystem.setLastUpdatedBy(null);

                    newSystem = systemImpactedRepository.save(newSystem);

                    // Update ProjectTeam references
                    List<ProjectTeam> teamsWithOldSystem = projectTeamRepository.findBySystemimpacted_SystemId(oldSystem.getSystemId());
                    for (ProjectTeam team : teamsWithOldSystem) {
                        team.setSystemimpacted(newSystem);
                    }
                    projectTeamRepository.saveAll(teamsWithOldSystem);
                } else {
                    // 🔁 No changes, but still associate with updated project
                    oldSystem.setProject(updatedProject);
                    oldSystem.setTenant(updatedProject.getTenant());
                    systemImpactedRepository.save(oldSystem);
                }
            } else {
                // New entry (no previous version)
                Systemimpacted newSystem = new Systemimpacted();
                newSystem.setSystemName(dto.getSystemName());
                newSystem.setProject(updatedProject);
                newSystem.setTenant(updatedProject.getTenant());
                newSystem.setStartTimestamp(LocalDateTime.now());
                newSystem.setEndTimestamp(null);
                newSystem.setLastUpdatedBy(null);

                systemImpactedRepository.save(newSystem);
            }
        }
    }



    public void associateExistingSystemsWithNewProject(List<Systemimpacted> systems, Project updatedProject) {
        for (Systemimpacted system : systems) {
            system.setProject(updatedProject);
        }
    }

}
