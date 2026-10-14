
package com.qik.backend.service;

import com.qik.backend.dto.LoginRequest;
import com.qik.backend.dto.LoginResponse;
import com.qik.backend.dto.RegisterRequest;
import com.qik.backend.dto.UserResponse;
import com.qik.backend.entity.Role;
import com.qik.backend.entity.User;
import com.qik.backend.exception.InvalidCredentialsException;
import com.qik.backend.repository.UserRepository;
import com.qik.backend.security.JwtService;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // CUSTOMER REGISTRATION
    public UserResponse registerCustomer(RegisterRequest request) {

        request.setEmail(request.getEmail().trim().toLowerCase(java.util.Locale.ROOT));
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .role(Role.CUSTOMER)
                .active(true)
                .build();

        User savedUser = userRepository.save(user);

        return UserResponse.builder()
                .id(savedUser.getId())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .email(savedUser.getEmail())
                .phoneNumber(savedUser.getPhoneNumber())
                .role(savedUser.getRole())
                .active(savedUser.getActive())
                .createdAt(savedUser.getCreatedAt())
                .build();
    }

    // CUSTOMER LOGIN WITH JWT
    public LoginResponse loginCustomer(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase(java.util.Locale.ROOT))
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        )) {
            throw new InvalidCredentialsException();
        }

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new InvalidCredentialsException();
        }

        String token = jwtService.generateToken(user);

        return new LoginResponse(
                token,
                "Bearer",
                3600
        );
    }
}
