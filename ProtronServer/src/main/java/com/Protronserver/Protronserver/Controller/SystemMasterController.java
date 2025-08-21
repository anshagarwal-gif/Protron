package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.Entities.SystemMaster;
import com.Protronserver.Protronserver.DTOs.SystemMasterDTO;
import com.Protronserver.Protronserver.Service.SystemMasterService;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/systems")
public class SystemMasterController {

    @Autowired
    private SystemMasterService systemMasterService;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    /**
     * Get all systems for the current user's tenant
     */
    @GetMapping("/tenant")
    public ResponseEntity<List<SystemMasterDTO>> getSystemsByCurrentTenant() {
        try {
            Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
            List<SystemMaster> systems = systemMasterService.getSystemsByTenant(tenantId);

            // Convert entities to DTOs to avoid lazy loading issues
            List<SystemMasterDTO> systemDTOs = systems.stream()
                    .map(system -> new SystemMasterDTO(
                            system.getSystemId(),
                            system.getSystemName(),
                            system.getSystemDesc(),
                            system.getTenant() != null ? system.getTenant().getTenantId() : null))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(systemDTOs);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Search systems by name for the current user's tenant
     */
    @GetMapping("/search")
    public ResponseEntity<List<SystemMasterDTO>> searchSystemsByName(@RequestParam String systemName) {
        try {
            Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
            List<SystemMaster> systems = systemMasterService.searchSystemsByName(systemName, tenantId);

            // Convert entities to DTOs to avoid lazy loading issues
            List<SystemMasterDTO> systemDTOs = systems.stream()
                    .map(system -> new SystemMasterDTO(
                            system.getSystemId(),
                            system.getSystemName(),
                            system.getSystemDesc(),
                            system.getTenant() != null ? system.getTenant().getTenantId() : null))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(systemDTOs);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get all systems (admin only)
     */
    @GetMapping
    public ResponseEntity<List<SystemMasterDTO>> getAllSystems() {
        try {
            List<SystemMaster> systems = systemMasterService.getAllSystems();

            // Convert entities to DTOs to avoid lazy loading issues
            List<SystemMasterDTO> systemDTOs = systems.stream()
                    .map(system -> new SystemMasterDTO(
                            system.getSystemId(),
                            system.getSystemName(),
                            system.getSystemDesc(),
                            system.getTenant() != null ? system.getTenant().getTenantId() : null))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(systemDTOs);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
