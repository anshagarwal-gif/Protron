package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.Entities.Modules;
import com.Protronserver.Protronserver.Repository.ModulesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/modules")
public class ModulesController {

    @Autowired
    private ModulesRepository modulesRepository;


    @GetMapping("/")
    public List<Modules> getModules(){
        return modulesRepository.findAll();
    }

}
