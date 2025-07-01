package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.Modules;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ModulesRepository extends JpaRepository<Modules, Long> {
}
