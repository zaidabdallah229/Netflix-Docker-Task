package com.netflix.auth;

import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestController
public class AuthController {

    public record SignupRequest(@NotBlank @Size(min = 3, max = 50) String username,
                                @NotBlank @Size(min = 6) String password) {
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {
    }

    public record AuthResponse(String token, Long id, String username, String role) {
        static AuthResponse of(String token, User u) {
            return new AuthResponse(token, u.getId(), u.getUsername(), u.getRole());
        }
    }

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwt;
    private final EventPublisher events;

    public AuthController(UserRepository users, PasswordEncoder passwordEncoder,
                          JwtService jwt, EventPublisher events) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwt = jwt;
        this.events = events;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "auth-service");
    }

    @PostMapping("/api/auth/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest req) {
        String username = req.username().trim();
        if (users.existsByUsername(username)) {
            return error(HttpStatus.CONFLICT, "Username is already taken");
        }
        User user = users.save(new User(username, passwordEncoder.encode(req.password()), "USER"));
        events.userRegistered(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(AuthResponse.of(jwt.generateToken(user), user));
    }

    @PostMapping("/api/auth/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        return users.findByUsername(req.username().trim())
                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(AuthResponse.of(jwt.generateToken(u), u)))
                .orElseGet(() -> error(HttpStatus.UNAUTHORIZED, "Invalid username or password"));
    }

    @GetMapping("/api/auth/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String header) {
        if (header == null || !header.startsWith("Bearer ")) {
            return error(HttpStatus.UNAUTHORIZED, "Missing token");
        }
        try {
            Claims c = jwt.parse(header.substring(7));
            return ResponseEntity.ok(Map.of(
                    "id", Long.valueOf(c.getSubject()),
                    "username", c.get("username", String.class),
                    "role", c.get("role", String.class)));
        } catch (Exception e) {
            return error(HttpStatus.UNAUTHORIZED, "Invalid token");
        }
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex) {
        var field = ex.getBindingResult().getFieldError();
        String message = field == null ? "Invalid request" : field.getField() + " " + field.getDefaultMessage();
        return error(HttpStatus.BAD_REQUEST, message);
    }

    private static ResponseEntity<?> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }
}
