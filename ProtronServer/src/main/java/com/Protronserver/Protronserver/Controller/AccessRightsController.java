package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.AccessRightDTO;
import com.Protronserver.Protronserver.Service.AccessRightService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/access")
public class AccessRightsController {

    @Autowired
    private AccessRightService accessRightService;

    @PutMapping("/edit")
    public void changeAccess(@RequestBody List<AccessRightDTO> accessRightDTOS){
        accessRightService.updateUserAccessRights(accessRightDTOS);
    }

}
