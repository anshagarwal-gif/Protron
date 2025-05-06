package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.SystemImpactedDTO;
import com.Protronserver.Protronserver.Entities.Project;
import com.Protronserver.Protronserver.Entities.ProjectTeam;
import com.Protronserver.Protronserver.Entities.Systemimpacted;
import com.Protronserver.Protronserver.Repository.ProjectTeamRepository;
import com.Protronserver.Protronserver.Repository.SystemImpactedRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ManageSystemImpactedService {

    @Autowired
    private SystemImpactedRepository systemImpactedRepository;

    @Autowired
    private ProjectTeamRepository projectTeamRepository;

    public void handleRemovedSystems(List<Long> removedSystemIds) {
        for (Long systemId : removedSystemIds) {
            List<ProjectTeam> teamsWithSystem = projectTeamRepository.findBySystemimpacted_SystemId(systemId);
            for (ProjectTeam team : teamsWithSystem) {
                team.setSystemimpacted(null);
            }
            projectTeamRepository.saveAll(teamsWithSystem);
            systemImpactedRepository.deleteById(systemId);
        }
    }

    public void handleUpdatedAndNewSystems(List<SystemImpactedDTO> systemDTOs, Project updatedProject) {
        for (SystemImpactedDTO dto : systemDTOs) {
            if (dto.getSystemId() != null) {
                Systemimpacted system = systemImpactedRepository.findById(dto.getSystemId())
                        .orElseThrow(() -> new RuntimeException("System Not found"));
                system.setSystemName(dto.getSystemName());
                system.setProject(updatedProject);
                system.setTenant(updatedProject.getTenant());
                systemImpactedRepository.save(system);
            } else {
                Systemimpacted newSystem = new Systemimpacted();
                newSystem.setSystemName(dto.getSystemName());
                newSystem.setProject(updatedProject);
                newSystem.setTenant(updatedProject.getTenant());
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
