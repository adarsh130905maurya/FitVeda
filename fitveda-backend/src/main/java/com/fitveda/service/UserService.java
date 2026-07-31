package com.fitveda.service;

import com.fitveda.dto.AuthResponse;
import com.fitveda.dto.LoginRequest;
import com.fitveda.dto.RegisterRequest;
import com.fitveda.model.User;
import com.fitveda.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User registerUser(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }
        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(req.getRole());
        return userRepository.save(user);
    }

    public AuthResponse loginUser(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        // Return dev token (Full JWT token generation is wired in Phase 3)
        return new AuthResponse(
                "dev-token-" + user.getId(),
                user.getRole().name(),
                user.getId(),
                user.getName()
        );
    }
}
