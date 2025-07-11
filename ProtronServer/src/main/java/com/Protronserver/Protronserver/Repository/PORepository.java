package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.PODetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PORepository extends JpaRepository<PODetails, Long> {
}
