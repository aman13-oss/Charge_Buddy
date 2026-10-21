package com.chargebuddy.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.chargebuddy.entity.UserProfile;

public interface UserProfileRepository
        extends JpaRepository<UserProfile, Long> {

    Optional<UserProfile> findByFirebaseUid(String firebaseUid);
}
