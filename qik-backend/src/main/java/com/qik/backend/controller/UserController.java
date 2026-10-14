
package com.qik.backend.controller;

import com.qik.backend.dto.LoginRequest;
import com.qik.backend.dto.LoginResponse;
import com.qik.backend.dto.RegisterRequest;
import com.qik.backend.dto.UserResponse;
import com.qik.backend.service.UserService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // CUSTOMER REGISTRATION
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        UserResponse user = userService.registerCustomer(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(user);
    }

    // CUSTOMER LOGIN WITH JWT
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {

        LoginResponse response = userService.loginCustomer(request);

        return ResponseEntity.ok(response);
    }
}
