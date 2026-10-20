package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.UserAuthIdentity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserAuthIdentityRepository extends JpaRepository<UserAuthIdentity, Long> {
    Optional<UserAuthIdentity> findByProviderAndProviderSubject(String provider, String providerSubject);
    Optional<UserAuthIdentity> findByUserIdAndProvider(Long userId, String provider);
}
