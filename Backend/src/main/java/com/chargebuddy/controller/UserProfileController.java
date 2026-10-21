package com.chargebuddy.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chargebuddy.entity.UserProfile;
import com.chargebuddy.repository.UserProfileRepository;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "*")
public class UserProfileController {

    private final UserProfileRepository repository;
    private final FirebaseApp firebaseApp;

    public UserProfileController(
            UserProfileRepository repository,
            FirebaseApp firebaseApp) {
        this.repository = repository;
        this.firebaseApp = firebaseApp;
    }

    private FirebaseToken verifyToken(String authorization)
            throws Exception {

        if (authorization == null ||
                !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Missing token");
        }

        String idToken = authorization.substring(7);

        return FirebaseAuth.getInstance(firebaseApp)
                .verifyIdToken(idToken);
    }

    @GetMapping
    public ResponseEntity<?> getProfile(
            @RequestHeader(value = "Authorization", required = false)
            String authorization) {

        try {
            FirebaseToken token = verifyToken(authorization);

            return repository.findByFirebaseUid(token.getUid())
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing or invalid authorization header"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or expired Firebase token"));
        }
    }

    @PutMapping
    public ResponseEntity<?> saveProfile(
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @RequestBody UserProfile request) {

        try {
            FirebaseToken token = verifyToken(authorization);

            UserProfile profile = repository
                    .findByFirebaseUid(token.getUid())
                    .orElseGet(UserProfile::new);

            profile.setFirebaseUid(token.getUid());
            profile.setEmail(token.getEmail());
            profile.setGoogleName(
                    token.getName() == null ? "" : token.getName());

            profile.setNickname(request.getNickname());
            profile.setPhone(request.getPhone());
            profile.setState(request.getState());
            profile.setCity(request.getCity());
            profile.setAddress(request.getAddress());

            return ResponseEntity.ok(repository.save(profile));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing or invalid authorization header"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("error", "Could not verify Firebase token"));
}
    }
}
