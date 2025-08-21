package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.Entities.SystemMaster;
import com.Protronserver.Protronserver.Repository.SystemMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SystemMasterService {

    @Autowired
    private SystemMasterRepository systemMasterRepository;

    /**
     * Get all systems for a specific tenant
     */
    public List<SystemMaster> getSystemsByTenant(Long tenantId) {
        return systemMasterRepository.findByTenant_TenantId(tenantId);
    }

    /**
     * Get system by name and tenant ID
     */
    public SystemMaster getSystemByNameAndTenant(String systemName, Long tenantId) {
        return systemMasterRepository.findBySystemNameAndTenant_TenantId(systemName, tenantId);
    }

    /**
     * Search systems by name containing the given text for a specific tenant
     */
    public List<SystemMaster> searchSystemsByName(String systemName, Long tenantId) {
        return systemMasterRepository.findBySystemNameContainingIgnoreCaseAndTenantId(systemName, tenantId);
    }

    /**
     * Get all systems
     */
    public List<SystemMaster> getAllSystems() {
        return systemMasterRepository.findAll();
    }

    /**
     * Get system by ID
     */
    public SystemMaster getSystemById(Integer systemId) {
        return systemMasterRepository.findById(systemId).orElse(null);
    }

    /**
     * Save a system
     */
    public SystemMaster saveSystem(SystemMaster system) {
        return systemMasterRepository.save(system);
    }
}
