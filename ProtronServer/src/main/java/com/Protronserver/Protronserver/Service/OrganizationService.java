package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.Entities.Organization;
import com.Protronserver.Protronserver.Repository.OrganizationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OrganizationService {

    @Autowired
    private OrganizationRepository organizationRepository;

    /**
     * Get all organizations for a specific tenant
     */
    public List<Organization> getOrganizationsByTenant(Long tenantId) {
        return organizationRepository.findByTenant_TenantId(tenantId);
    }

    /**
     * Get organization by name and tenant ID
     */
    public Organization getOrganizationByNameAndTenant(String orgName, Long tenantId) {
        return organizationRepository.findByOrgNameAndTenant_TenantId(orgName, tenantId);
    }

    /**
     * Search organizations by name containing the given text for a specific tenant
     */
    public List<Organization> searchOrganizationsByName(String orgName, Long tenantId) {
        return organizationRepository.findByOrgNameContainingIgnoreCaseAndTenantId(orgName, tenantId);
    }

    /**
     * Get organizations by type for a specific tenant
     */
    public List<Organization> getOrganizationsByType(String orgType, Long tenantId) {
        return organizationRepository.findByOrgTypeAndTenant_TenantId(orgType, tenantId);
    }

    /**
     * Search organizations by type containing the given text for a specific tenant
     */
    public List<Organization> searchOrganizationsByType(String orgType, Long tenantId) {
        return organizationRepository.findByOrgTypeContainingIgnoreCaseAndTenantId(orgType, tenantId);
    }

    /**
     * Get all organizations
     */
    public List<Organization> getAllOrganizations() {
        return organizationRepository.findAll();
    }

    /**
     * Get organization by ID
     */
    public Organization getOrganizationById(Integer orgId) {
        return organizationRepository.findById(orgId).orElse(null);
    }

    /**
     * Save an organization
     */
    public Organization saveOrganization(Organization organization) {
        return organizationRepository.save(organization);
    }

    /**
     * Delete an organization
     */
    public void deleteOrganization(Integer orgId) {
        organizationRepository.deleteById(orgId);
    }
}

