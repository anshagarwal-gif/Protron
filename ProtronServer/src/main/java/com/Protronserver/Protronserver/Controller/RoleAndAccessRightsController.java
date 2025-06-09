package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.AccessRightDTO;
import com.Protronserver.Protronserver.Entities.Role;
import com.Protronserver.Protronserver.Service.RoleAccessRightService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/access")
public class RoleAndAccessRightsController {

    @Autowired
    private RoleAccessRightService roleAccessRightService;

    @PutMapping("/edit")
    public void changeRoleAndAccess(@RequestParam Long userIdToUpdate, @RequestParam(required = false) Long roleId,  @RequestBody List<AccessRightDTO> accessRightDTOS){
        roleAccessRightService.updateRoleAndAccess(userIdToUpdate, roleId, accessRightDTOS);
    }

    @GetMapping("/getRoles")
    public List<Role> getRoles(){
        return roleAccessRightService.getRoles();
    }

    @PutMapping("/role/edit")
    public void changeRoleAccess(@RequestParam Long roleId, @RequestBody List<AccessRightDTO> updatedRoleAccess){
        roleAccessRightService.updateRoleAccessRights(roleId, updatedRoleAccess);
    }
}
