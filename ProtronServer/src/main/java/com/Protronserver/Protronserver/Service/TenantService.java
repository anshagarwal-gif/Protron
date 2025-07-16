package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.TenantEditDTO;
import com.Protronserver.Protronserver.DTOs.TenantRequestDTO;
import com.Protronserver.Protronserver.Entities.Project;
import com.Protronserver.Protronserver.Entities.Tenant;
import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.Repository.ProjectRepository;
import com.Protronserver.Protronserver.Repository.TenantRepository;
import com.Protronserver.Protronserver.Repository.UserRepository;
import com.Protronserver.Protronserver.ResultDTOs.TeamTableResultDTO;
import com.Protronserver.Protronserver.ResultDTOs.UsersTableResultDTO;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TenantService {

    @Autowired
    TenantRepository tenantRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    public Tenant addTenant(TenantRequestDTO tenantRequestDTO) {
        Tenant tenant = new Tenant();
        tenant.setTenantName(tenantRequestDTO.getTenantName());
        tenant.setTenantContactName(tenantRequestDTO.getTenantContactName());
        tenant.setTenantContactEmail(tenantRequestDTO.getTenantContactEmail());
        tenant.setTenantContactDesc(tenantRequestDTO.getTenantContactDesc());
        tenant.setTenantContactPhone(tenantRequestDTO.getTenantContactPhone());
        tenant.setTenantAddressLine1(tenantRequestDTO.getTenantAddressLine1());
        tenant.setTenantAddressLine2(tenantRequestDTO.getTenantAddressLine2());
        tenant.setTenantAddressLine3(tenantRequestDTO.getTenantAddressLine3());
        tenant.setTenantAddressPostalCode(tenantRequestDTO.getTenantAddressPostalCode());

        return tenantRepository.save(tenant);
    }

    public Tenant editTenant(Long tenantId, TenantEditDTO tenantRequestDTO) {
        Tenant existingTenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Tenant not found with ID: " + tenantId));

        if (tenantRequestDTO.getTenantName() != null) {
            existingTenant.setTenantName(tenantRequestDTO.getTenantName());
        }
        if (tenantRequestDTO.getTenantContactName() != null) {
            existingTenant.setTenantContactName(tenantRequestDTO.getTenantContactName());
        }
        if (tenantRequestDTO.getTenantContactEmail() != null) {
            existingTenant.setTenantContactEmail(tenantRequestDTO.getTenantContactEmail());
        }
        if (tenantRequestDTO.getTenantContactDesc() != null) {
            existingTenant.setTenantContactDesc(tenantRequestDTO.getTenantContactDesc());
        }
        if (tenantRequestDTO.getTenantContactPhone() != null) {
            existingTenant.setTenantContactPhone(tenantRequestDTO.getTenantContactPhone());
        }
        if (tenantRequestDTO.getTenantAddressLine1() != null) {
            existingTenant.setTenantAddressLine1(tenantRequestDTO.getTenantAddressLine1());
        }
        if (tenantRequestDTO.getTenantAddressLine2() != null) {
            existingTenant.setTenantAddressLine2(tenantRequestDTO.getTenantAddressLine2());
        }
        if (tenantRequestDTO.getTenantAddressLine3() != null) {
            existingTenant.setTenantAddressLine3(tenantRequestDTO.getTenantAddressLine3());
        }
        if (tenantRequestDTO.getTenantAddressPostalCode() != null) {
            existingTenant.setTenantAddressPostalCode(tenantRequestDTO.getTenantAddressPostalCode());
        }

        return tenantRepository.save(existingTenant);
    }

    public List<Tenant> getAllTenants() {
        return tenantRepository.findAll();
    }

    public Tenant getTenantById(Long tenantId) {
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found with id: " + tenantId));
    }

    public void deleteTenant(Long tenantId) {
        tenantRepository.deleteById(tenantId);
    }

    public List<TeamTableResultDTO> getTeamTableUsersByTenantId(Long tenantId) {
        return tenantRepository.getTeamUsersByTenant(tenantId);
    }

    public List<UsersTableResultDTO> getUsersByTenantId(Long tenantId){
        List<User> users = tenantRepository.getUsersWithRoleAndAccessRightsByTenantId(tenantId);
        return users.stream().map(u -> new UsersTableResultDTO(
                u.getUserId(),
                u.getFirstName() + " " + u.getLastName(),
                u.getEmail(),
                u.getMobilePhone(),
                u.getCity(),
                u.getCountry(),
                u.getStatus(),
                u.getTenant().getTenantName(),
                u.getRole(),
                u.getUserAccessRights()
        )).collect(Collectors.toList());
    }

    public List<Project> getProjectsByTenantId(Long tenantId) {
        return projectRepository.findByTenantTenantIdAndEndTimestampIsNull(tenantId);
    }

}
