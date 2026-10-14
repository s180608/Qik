
package com.qik.backend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/test/roles")
public class RoleTestController {

    @GetMapping("/customer")
    @PreAuthorize("hasRole('CUSTOMER')")
    public Map<String, String> customerEndpoint() {
        return Map.of(
                "message", "Welcome QIK Customer!"
        );
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> adminEndpoint() {
        return Map.of(
                "message", "Welcome QIK Admin!"
        );
    }

    @GetMapping("/rider")
    @PreAuthorize("hasRole('RIDER')")
    public Map<String, String> riderEndpoint() {
        return Map.of(
                "message", "Welcome QIK Rider!"
        );
    }
}
