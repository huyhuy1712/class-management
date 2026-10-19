package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.email = :email")
    Optional<User> findByEmailForUpdate(@Param("email") String email);

    List<User> findAllByRoleNot(UserRole role);
    List<User> findAllByRole(UserRole role);

    boolean existsByUsername(String username);
    boolean existsByUsernameAndIdNot(String username, Long id);

    boolean existsByEmail(String email);

    boolean existsByRole(UserRole role);

    long countByRole(UserRole role);

    long countByRoleNot(UserRole role);

    long countByRoleNotAndStatus(UserRole role, UserStatus status);

    boolean existsByPhone(String phone);

    boolean existsByEmailAndIdNot(String email, Long id);

    boolean existsByPhoneAndIdNot(String phone, Long id);

    Optional<User> findByStudentCode(String studentCode);
    Optional<User> findByStudentCodeIgnoreCase(String studentCode);
}