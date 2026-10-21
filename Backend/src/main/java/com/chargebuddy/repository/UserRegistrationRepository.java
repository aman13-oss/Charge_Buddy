package com.chargebuddy.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.chargebuddy.entity.UserRegistration;

public interface UserRegistrationRepository
        extends JpaRepository<UserRegistration, Long> {

    Optional<UserRegistration> findByFirebaseUid(String firebaseUid);
}