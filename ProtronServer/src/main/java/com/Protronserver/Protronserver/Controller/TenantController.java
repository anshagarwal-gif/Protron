package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.TenantEditDTO;
import com.Protronserver.Protronserver.DTOs.TenantRequestDTO;
import com.Protronserver.Protronserver.Entities.Project;
import com.Protronserver.Protronserver.Entities.Tenant;
import com.Protronserver.Protronserver.Entities.User;
import com.Protronserver.Protronserver.ResultDTOs.ProjectTableDTO;
import com.Protronserver.Protronserver.ResultDTOs.TeamTableResultDTO;
import com.Protronserver.Protronserver.ResultDTOs.UsersTableResultDTO;
import com.Protronserver.Protronserver.Service.TenantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tenants")
public class TenantController {

    @Autowired
    private TenantService tenantService;

    @PostMapping
    public Tenant addTenant(@RequestBody TenantRequestDTO tenantRequestDTO) {
        return tenantService.addTenant(tenantRequestDTO);
    }

    @PutMapping("/{tenantId}")
    public Tenant updateTenant(@PathVariable Long tenantId, @RequestBody TenantEditDTO tenantEditRequestDTO) {
        return tenantService.editTenant(tenantId, tenantEditRequestDTO);
    }

    @GetMapping
    public List<Tenant> getAllTenants() {
        return tenantService.getAllTenants();
    }

    @GetMapping("/{tenantId}")
    public Tenant getTenantById(@PathVariable Long tenantId) {
        return tenantService.getTenantById(tenantId);
    }

    @DeleteMapping("/{tenantId}")
    public void deleteTenant(@PathVariable Long tenantId) {
        tenantService.deleteTenant(tenantId);
    }

    @GetMapping("/{tenantId}/users")
    public List<TeamTableResultDTO> getUsersByTenant(@PathVariable Long tenantId) {
        return tenantService.getTeamTableUsersByTenantId(tenantId);
    }

    @GetMapping("/{tenantId}/userstable")
    public List<UsersTableResultDTO> getUsersforUserTable(@PathVariable Long tenantId){
        return tenantService.getUsersByTenantId(tenantId);
    }

    // Fetch Projects for a particular tenant
    @GetMapping("/{tenantId}/projects")
    public List<ProjectTableDTO> getProjectsByTenant(@PathVariable Long tenantId) {
        return tenantService.getProjectsByTenantId(tenantId);
    }

}
