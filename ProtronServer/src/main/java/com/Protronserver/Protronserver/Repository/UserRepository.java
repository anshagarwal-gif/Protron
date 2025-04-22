package com.Protronserver.Protronserver.Repository;

import com.Protronserver.Protronserver.Entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    List<User> findByFirstNameIgnoreCaseAndEndTimestampIsNull(String firstName);
    Optional<User> findByEmailAndEndTimestampIsNull(String email);
    Optional<User> findByEmpCodeAndEndTimestampIsNull(String empCode);
    boolean existsByEmail(String email);
    List<User> findByEndTimestampIsNull();
    Optional<User> findByUserIdAndEndTimestampIsNull(Long id);

}
