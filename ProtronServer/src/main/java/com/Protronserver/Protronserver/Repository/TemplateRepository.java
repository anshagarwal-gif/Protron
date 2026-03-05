package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.Template;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TemplateRepository extends JpaRepository<Template, Long> {

    Optional<Template> findByTemplateName(String templateName);
}

