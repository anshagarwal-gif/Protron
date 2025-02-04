package com.protron.Protron.repository;

import com.protron.Protron.entities.Approver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApproverRepository extends JpaRepository<Approver, Long> {
    Approver findByEmail(String email);
}
