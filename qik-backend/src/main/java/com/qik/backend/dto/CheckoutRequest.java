package com.qik.backend.dto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
public record CheckoutRequest(
 @NotBlank @Size(max=200) String address,
 @NotBlank @Pattern(regexp="(?i)^(?:GIR ?0AA|[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2})$",message="Enter a valid UK postcode") String postcode,
 @NotBlank @Size(max=80) String requestKey,
 @NotEmpty @Size(max=50) List<@Valid Line> items) {
 public record Line(@NotNull Long productId,@Min(1) @Max(99) int quantity) {}
}
