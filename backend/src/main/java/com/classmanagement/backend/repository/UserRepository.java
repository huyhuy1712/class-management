package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByRole(UserRole role);

    boolean existsByPhone(String phone);
}