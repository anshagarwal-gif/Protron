package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.Entities.Organization;
import com.Protronserver.Protronserver.DTOs.OrganizationDTO;
import com.Protronserver.Protronserver.Service.OrganizationService;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {

    @Autowired
    private OrganizationService organizationService;

    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    /**
     * Get all organizations for the current user's tenant
     */
    @GetMapping("/tenant")
    public ResponseEntity<List<OrganizationDTO>> getOrganizationsByCurrentTenant() {
        try {
            Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
            List<Organization> organizations = organizationService.getOrganizationsByTenant(tenantId);

            // Convert entities to DTOs to avoid lazy loading issues
            List<OrganizationDTO> organizationDTOs = organizations.stream()
                    .map(org -> new OrganizationDTO(
                            org.getOrgId(),
                            org.getOrgName(),
                            org.getOrgAddress(),
                            org.getOrgCity(),
                            org.getOrgState(),
                            org.getOrgCountry(),
                            org.getOrgZip(),
                            org.getOrgType(),
                            org.getOrgTaxName(),
                            org.getOrgTaxId(),
                            org.getOrgDesc(),
                            org.getTenant() != null ? org.getTenant().getTenantId() : null))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(organizationDTOs);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Search organizations by name for the current user's tenant
     */
    @GetMapping("/search")
    public ResponseEntity<List<OrganizationDTO>> searchOrganizationsByName(@RequestParam String orgName) {
        try {
            Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
            List<Organization> organizations = organizationService.searchOrganizationsByName(orgName, tenantId);

            // Convert entities to DTOs to avoid lazy loading issues
            List<OrganizationDTO> organizationDTOs = organizations.stream()
                    .map(org -> new OrganizationDTO(
                            org.getOrgId(),
                            org.getOrgName(),
                            org.getOrgAddress(),
                            org.getOrgCity(),
                            org.getOrgState(),
                            org.getOrgCountry(),
                            org.getOrgZip(),
                            org.getOrgType(),
                            org.getOrgTaxName(),
                            org.getOrgTaxId(),
                            org.getOrgDesc(),
                            org.getTenant() != null ? org.getTenant().getTenantId() : null))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(organizationDTOs);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get organizations by type for the current user's tenant
     */
    @GetMapping("/type/{orgType}")
    public ResponseEntity<List<OrganizationDTO>> getOrganizationsByType(@PathVariable String orgType) {
        try {
            Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
            List<Organization> organizations = organizationService.getOrganizationsByType(orgType, tenantId);

            // Convert entities to DTOs to avoid lazy loading issues
            List<OrganizationDTO> organizationDTOs = organizations.stream()
                    .map(org -> new OrganizationDTO(
                            org.getOrgId(),
                            org.getOrgName(),
                            org.getOrgAddress(),
                            org.getOrgCity(),
                            org.getOrgState(),
                            org.getOrgCountry(),
                            org.getOrgZip(),
                            org.getOrgType(),
                            org.getOrgTaxName(),
                            org.getOrgTaxId(),
                            org.getOrgDesc(),
                            org.getTenant() != null ? org.getTenant().getTenantId() : null))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(organizationDTOs);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get all organizations (admin only)
     */
    @GetMapping
    public ResponseEntity<List<OrganizationDTO>> getAllOrganizations() {
        try {
            List<Organization> organizations = organizationService.getAllOrganizations();

            // Convert entities to DTOs to avoid lazy loading issues
            List<OrganizationDTO> organizationDTOs = organizations.stream()
                    .map(org -> new OrganizationDTO(
                            org.getOrgId(),
                            org.getOrgName(),
                            org.getOrgAddress(),
                            org.getOrgCity(),
                            org.getOrgState(),
                            org.getOrgCountry(),
                            org.getOrgZip(),
                            org.getOrgType(),
                            org.getOrgTaxName(),
                            org.getOrgTaxId(),
                            org.getOrgDesc(),
                            org.getTenant() != null ? org.getTenant().getTenantId() : null))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(organizationDTOs);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get organization by ID
     */
    @GetMapping("/{orgId}")
    public ResponseEntity<OrganizationDTO> getOrganizationById(@PathVariable Integer orgId) {
        try {
            Organization organization = organizationService.getOrganizationById(orgId);
            if (organization == null) {
                return ResponseEntity.notFound().build();
            }

            OrganizationDTO organizationDTO = new OrganizationDTO(
                    organization.getOrgId(),
                    organization.getOrgName(),
                    organization.getOrgAddress(),
                    organization.getOrgCity(),
                    organization.getOrgState(),
                    organization.getOrgCountry(),
                    organization.getOrgZip(),
                    organization.getOrgType(),
                    organization.getOrgTaxName(),
                    organization.getOrgTaxId(),
                    organization.getOrgDesc(),
                    organization.getTenant() != null ? organization.getTenant().getTenantId() : null);

            return ResponseEntity.ok(organizationDTO);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Create a new organization
     */
    @PostMapping
    public ResponseEntity<OrganizationDTO> createOrganization(@RequestBody Organization organization) {
        try {
            // Set the tenant ID from the logged-in user
            Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
            organization.getTenant().setTenantId(tenantId);

            Organization savedOrganization = organizationService.saveOrganization(organization);

            OrganizationDTO organizationDTO = new OrganizationDTO(
                    savedOrganization.getOrgId(),
                    savedOrganization.getOrgName(),
                    savedOrganization.getOrgAddress(),
                    savedOrganization.getOrgCity(),
                    savedOrganization.getOrgState(),
                    savedOrganization.getOrgCountry(),
                    savedOrganization.getOrgZip(),
                    savedOrganization.getOrgType(),
                    savedOrganization.getOrgTaxName(),
                    savedOrganization.getOrgTaxId(),
                    savedOrganization.getOrgDesc(),
                    savedOrganization.getTenant() != null ? savedOrganization.getTenant().getTenantId() : null);

            return ResponseEntity.ok(organizationDTO);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Update an existing organization
     */
    @PutMapping("/{orgId}")
    public ResponseEntity<OrganizationDTO> updateOrganization(@PathVariable Integer orgId,
            @RequestBody Organization organization) {
        try {
            Organization existingOrganization = organizationService.getOrganizationById(orgId);
            if (existingOrganization == null) {
                return ResponseEntity.notFound().build();
            }

            // Set the ID and tenant ID
            organization.setOrgId(orgId);
            Long tenantId = loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
            organization.getTenant().setTenantId(tenantId);

            Organization updatedOrganization = organizationService.saveOrganization(organization);

            OrganizationDTO organizationDTO = new OrganizationDTO(
                    updatedOrganization.getOrgId(),
                    updatedOrganization.getOrgName(),
                    updatedOrganization.getOrgAddress(),
                    updatedOrganization.getOrgCity(),
                    updatedOrganization.getOrgState(),
                    updatedOrganization.getOrgCountry(),
                    updatedOrganization.getOrgZip(),
                    updatedOrganization.getOrgType(),
                    updatedOrganization.getOrgTaxName(),
                    updatedOrganization.getOrgTaxId(),
                    updatedOrganization.getOrgDesc(),
                    updatedOrganization.getTenant() != null ? updatedOrganization.getTenant().getTenantId() : null);

            return ResponseEntity.ok(organizationDTO);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Delete an organization
     */
    @DeleteMapping("/{orgId}")
    public ResponseEntity<Void> deleteOrganization(@PathVariable Integer orgId) {
        try {
            Organization existingOrganization = organizationService.getOrganizationById(orgId);
            if (existingOrganization == null) {
                return ResponseEntity.notFound().build();
            }

            organizationService.deleteOrganization(orgId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}

