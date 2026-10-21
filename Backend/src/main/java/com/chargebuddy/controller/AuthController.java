
package com.chargebuddy.controller;

import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chargebuddy.entity.UserRegistration;
import com.chargebuddy.repository.UserRegistrationRepository;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRegistrationRepository registrationRepository;
    private final FirebaseApp firebaseApp;

    public AuthController(
            UserRegistrationRepository registrationRepository,
            FirebaseApp firebaseApp) {
        this.registrationRepository = registrationRepository;
        this.firebaseApp = firebaseApp;
    }

    private FirebaseToken verifyToken(String idToken) throws Exception {
        return FirebaseAuth.getInstance(firebaseApp).verifyIdToken(idToken);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestHeader("Authorization") String authorization) {

        try {
            String idToken = authorization.replaceFirst("(?i)^Bearer\\s+", "");
            FirebaseToken decodedToken = verifyToken(idToken);

            String uid = decodedToken.getUid();
            String email = decodedToken.getEmail();

            if (email == null || email.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Google account email is missing"));
            }

            Optional<UserRegistration> existing =
                    registrationRepository.findByFirebaseUid(uid);

            if (existing.isPresent()) {
                return ResponseEntity.ok(
                        Map.of("message", "Already registered", "registered", true));
            }

            UserRegistration user = new UserRegistration();
            user.setFirebaseUid(uid);
            user.setEmail(email);
            registrationRepository.save(user);

            return ResponseEntity.ok(
                    Map.of("message", "Registration successful", "registered", true));

        } catch (Exception e) {
            System.err.println("Registration error: " + e.getMessage());

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentication failed"));
        }
    }

    @GetMapping("/check")
    public ResponseEntity<?> checkRegistration(
            @RequestHeader("Authorization") String authorization) {

        try {
            String idToken = authorization.replaceFirst("(?i)^Bearer\\s+", "");
            FirebaseToken decodedToken = verifyToken(idToken);

            boolean registered = registrationRepository
                    .findByFirebaseUid(decodedToken.getUid())
                    .isPresent();

            return ResponseEntity.ok(Map.of("registered", registered));

        } catch (Exception e) {
            System.err.println("Registration check error: " + e.getMessage());

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentication failed"));
        }
    }
}
